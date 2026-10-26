
import { Router } from "express";
import bcrypt from "bcryptjs";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import nodemailer from "nodemailer";
import { createHash, randomInt } from "node:crypto";
import { User } from "../users/user.model.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again later." },
});

const emailSchema = z.string().trim().email().max(254);

const signupSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: emailSchema,
    password: z.string().min(6).max(128),
    confirmPassword: z.string().min(6).max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

const resendSchema = z.object({
  email: emailSchema,
});

const CODE_EXPIRY_MS = 10 * 60 * 1000;
const MAX_VERIFICATION_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashVerificationCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function publicUser(user: {
  _id: unknown;
  name: string;
  email: string;
  emailVerified: boolean;
}) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
  };
}

function regenerateSession(req: Express.Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function saveSession(req: Express.Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function destroySession(req: Express.Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function createEmailTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  });
}

async function sendVerificationEmail(email: string, code: string) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    throw new Error("SMTP_USER and SMTP_PASS must be configured.");
  }

  const transporter = createEmailTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || smtpUser,
    to: email,
    subject: "Verify your Fieldnotes email",
    text: [
      "Welcome to Fieldnotes!",
      "",
      `Your email verification code is: ${code}`,
      "",
      "This code expires in 10 minutes.",
      "If you did not create a Fieldnotes account, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#292824;line-height:1.6">
        <h2 style="font-weight:600">Verify your email</h2>
        <p>Thanks for signing up for Fieldnotes. Enter the code below to verify your email address.</p>
        <div style="font-size:30px;letter-spacing:8px;font-weight:700;padding:18px 0">
          ${code}
        </div>
        <p>This code expires in 10 minutes.</p>
        <p style="font-size:13px;color:#777">
          If you did not create a Fieldnotes account, you can ignore this email.
        </p>
      </div>
    `,
  });
}

async function issueVerificationCode(user: {
  email: string;
  emailVerified: boolean;
  verificationCodeHash?: string;
  verificationCodeExpiresAt?: Date;
  verificationAttempts: number;
  save: () => Promise<unknown>;
}) {
  if (user.emailVerified) {
    return { alreadyVerified: true };
  }

  const now = Date.now();

  if (
    user.verificationCodeExpiresAt &&
    user.verificationCodeExpiresAt.getTime() - now >
      CODE_EXPIRY_MS - RESEND_COOLDOWN_MS
  ) {
    throw new Error("VERIFICATION_COOLDOWN");
  }

  const code = randomInt(100000, 1000000).toString();

  user.verificationCodeHash = hashVerificationCode(code);
  user.verificationCodeExpiresAt = new Date(now + CODE_EXPIRY_MS);
  user.verificationAttempts = 0;

  await user.save();

  try {
    await sendVerificationEmail(user.email, code);
  } catch (error) {
    // Invalidate the code if delivery fails.
    user.verificationCodeHash = undefined;
    user.verificationCodeExpiresAt = undefined;
    user.verificationAttempts = 0;
    await user.save();
    throw error;
  }

  return { alreadyVerified: false };
}

// SIGN UP
router.post("/signup", authLimiter, async (req, res, next) => {
  try {
    const parsed = signupSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Please check your details.",
        fields: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, password } = parsed.data;
    const email = normalizeEmail(parsed.data.email);

    const existing = await User.exists({ email });

    if (existing) {
      res.status(409).json({
        error:
          "An account with these details cannot be created. Try signing in.",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const code = randomInt(100000, 1000000).toString();

    let user;

    try {
      user = await User.create({
        name,
        email,
        passwordHash,
        emailVerified: false,
        verificationCodeHash: hashVerificationCode(code),
        verificationCodeExpiresAt: new Date(Date.now() + CODE_EXPIRY_MS),
        verificationAttempts: 0,
      });
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        res.status(409).json({
          error:
            "An account with these details cannot be created. Try signing in.",
        });
        return;
      }

      throw error;
    }

    try {
      await sendVerificationEmail(email, code);
    } catch (error) {
      // Leave the account unverified; the user can request a new code.
      user.verificationCodeHash = undefined;
      user.verificationCodeExpiresAt = undefined;
      await user.save();

      console.error("Verification email delivery failed:", error);

      res.status(503).json({
        error:
          "We couldn't send your verification email. Please try requesting a new code shortly.",
        email,
      });
      return;
    }

    // Do not create an authenticated session before verification.
    res.status(201).json({
      message: "Verification code sent. Check your email to continue.",
      email,
      requiresEmailVerification: true,
    });
  } catch (error) {
    next(error);
  }
});

// VERIFY EMAIL
router.post("/verify-email", authLimiter, async (req, res, next) => {
  try {
    const parsed = verifyEmailSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Enter a valid email and 6-digit verification code.",
        fields: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const email = normalizeEmail(parsed.data.email);
    const submittedHash = hashVerificationCode(parsed.data.code);

    const user = await User.findOne({ email }).select(
      "+verificationCodeHash +verificationCodeExpiresAt +verificationAttempts",
    );

    if (!user) {
      res.status(400).json({
        error: "Invalid or expired verification code.",
      });
      return;
    }

    if (user.emailVerified) {
      res.status(200).json({
        message: "Your email is already verified. You can sign in.",
      });
      return;
    }

    if (
      user.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS
    ) {
      res.status(429).json({
        error: "Too many incorrect codes. Request a new verification code.",
      });
      return;
    }

    if (
      !user.verificationCodeHash ||
      !user.verificationCodeExpiresAt ||
      user.verificationCodeExpiresAt.getTime() <= Date.now()
    ) {
      res.status(400).json({
        error: "Your verification code has expired. Request a new code.",
      });
      return;
    }

    if (submittedHash !== user.verificationCodeHash) {
      user.verificationAttempts += 1;
      await user.save();

      res.status(400).json({
        error: "Invalid or expired verification code.",
        attemptsRemaining: Math.max(
          0,
          MAX_VERIFICATION_ATTEMPTS - user.verificationAttempts,
        ),
      });
      return;
    }

    user.emailVerified = true;
    user.verificationCodeHash = undefined;
    user.verificationCodeExpiresAt = undefined;
    user.verificationAttempts = 0;

    await user.save();

    res.json({
      message: "Email verified successfully. You can now sign in.",
      emailVerified: true,
    });
  } catch (error) {
    next(error);
  }
});

// RESEND VERIFICATION CODE
router.post("/resend-verification", authLimiter, async (req, res, next) => {
  try {
    const parsed = resendSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Enter a valid email address." });
      return;
    }

    const email = normalizeEmail(parsed.data.email);

    const user = await User.findOne({ email }).select(
      "+verificationCodeHash +verificationCodeExpiresAt +verificationAttempts",
    );

    // Avoid revealing whether an email address has an account.
    if (!user || user.emailVerified) {
      res.json({
        message:
          "If an unverified account exists for this email, a verification code will be sent.",
      });
      return;
    }

    try {
      await issueVerificationCode(user);
    } catch (error) {
      if (error instanceof Error && error.message === "VERIFICATION_COOLDOWN") {
        res.status(429).json({
          error: "Please wait a minute before requesting another code.",
        });
        return;
      }

      throw error;
    }

    res.json({
      message: "If your account is unverified, a new code has been sent.",
    });
  } catch (error) {
    next(error);
  }
});

// LOG IN
router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid email or password." });
      return;
    }

    const email = normalizeEmail(parsed.data.email);

    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user) {
      await bcrypt.hash(parsed.data.password, 12);
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const matches = await bcrypt.compare(
      parsed.data.password,
      user.passwordHash,
    );

    if (!matches) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    if (!user.emailVerified) {
      res.status(403).json({
        error: "Please verify your email before signing in.",
        requiresEmailVerification: true,
        email: user.email,
      });
      return;
    }

    await regenerateSession(req);
    req.session.userId = String(user._id);
    await saveSession(req);

    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

// CURRENT USER
router.get("/me", async (req, res, next) => {
  try {
    if (!req.session.userId) {
      res.status(401).json({ error: "Not signed in." });
      return;
    }

    const user = await User.findById(req.session.userId);

    if (!user) {
      await destroySession(req);

      res.status(401).json({ error: "Not signed in." });
      return;
    }

    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

// LOG OUT
router.post("/logout", (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      next(error);
      return;
    }

    res.clearCookie("fieldnotes.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.status(204).end();
  });
});

export default router;
