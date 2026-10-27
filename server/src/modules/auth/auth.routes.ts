
import { Router } from "express";
import bcrypt from "bcryptjs";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import nodemailer from "nodemailer";
import { createHash, randomBytes, randomInt } from "node:crypto";
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

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const verifyResetCodeSchema = z.object({
  email: emailSchema,
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

const resetPasswordSchema = z
  .object({
    email: emailSchema,
    resetToken: z.string().min(32).max(256),
    password: z.string().min(6).max(128),
    confirmPassword: z.string().min(6).max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

const CODE_EXPIRY_MS = 10 * 60 * 1000;
const RESET_TOKEN_EXPIRY_MS = 10 * 60 * 1000;
const MAX_VERIFICATION_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashVerificationCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
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
    subject: "Your Fieldnotes verification code",
    text: [
      "Your Fieldnotes verification code is:",
      "",
      code,
      "",
      "This code expires in 10 minutes.",
      "If you did not request this code, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#292824;line-height:1.6">
        <h2 style="font-weight:600">Your Fieldnotes verification code</h2>
        <p>Enter the following code to continue.</p>
        <div style="font-size:30px;letter-spacing:8px;font-weight:700;padding:18px 0">
          ${code}
        </div>
        <p>This code expires in 10 minutes.</p>
        <p style="font-size:13px;color:#777">
          If you did not request this code, you can ignore this email.
        </p>
      </div>
    `,
  });
}

async function sendPasswordResetEmail(email: string, code: string) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    throw new Error("SMTP_USER and SMTP_PASS must be configured.");
  }

  const transporter = createEmailTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || smtpUser,
    to: email,
    subject: "Reset your Fieldnotes password",
    text: [
      "Your Fieldnotes password-reset code is:",
      "",
      code,
      "",
      "This code expires in 10 minutes.",
      "If you did not request a password reset, ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#292824;line-height:1.6">
        <h2 style="font-weight:600">Reset your Fieldnotes password</h2>
        <p>Enter this one-time code to continue resetting your password.</p>
        <div style="font-size:30px;letter-spacing:8px;font-weight:700;padding:18px 0">
          ${code}
        </div>
        <p>This code expires in 10 minutes.</p>
        <p style="font-size:13px;color:#777">
          If you did not request a password reset, you can ignore this email.
        </p>
      </div>
    `,
  });
}

async function issueVerificationCode(
  user: {
    email: string;
    emailVerified: boolean;
    verificationCodeHash?: string;
    verificationCodeExpiresAt?: Date;
    verificationAttempts: number;
    save: () => Promise<unknown>;
  },
  allowVerifiedAccount = false,
  bypassCooldown = false,
) {
  if (user.emailVerified && !allowVerifiedAccount) {
    return { alreadyVerified: true };
  }

  const now = Date.now();

  if (
    !bypassCooldown &&
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
      user.verificationCodeHash = undefined;
      user.verificationCodeExpiresAt = undefined;
      await user.save();

      console.error("Verification email delivery failed:", error);

      res.status(503).json({
        error:
          "We couldn't send your verification email. Check the email configuration and try again.",
        email,
      });
      return;
    }

    res.status(201).json({
      message: "Verification code sent. Check your email to continue.",
      email,
      requiresEmailVerification: true,
    });
  } catch (error) {
    next(error);
  }
});

// VERIFY EMAIL AFTER SIGNUP
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
      res.json({
        message: "Your email is already verified. You can sign in.",
      });
      return;
    }

    if (user.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
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

// RESEND SIGNUP VERIFICATION CODE
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

      console.error("Resend verification email failed:", error);
      res.status(503).json({
        error: "We couldn't send the verification code. Please try again later.",
      });
      return;
    }

    res.json({
      message: "If your account is unverified, a new code has been sent.",
    });
  } catch (error) {
    next(error);
  }
});

// LOG IN — CHECK CREDENTIALS, THEN SEND OTP
router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid email or password." });
      return;
    }

    const email = normalizeEmail(parsed.data.email);

    const user = await User.findOne({ email }).select(
      "+passwordHash +verificationCodeHash +verificationCodeExpiresAt +verificationAttempts",
    );

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

    try {
      await issueVerificationCode(user, true, true);
    } catch (error) {
      console.error("Login OTP delivery failed:", error);

      res.status(503).json({
        error:
          "Your credentials are correct, but we couldn't send the login code. Check the server email configuration and try again.",
      });
      return;
    }

    res.json({
      message: "Your login code has been sent. Check your email.",
      email: user.email,
      requiresLoginVerification: true,
    });
  } catch (error) {
    next(error);
  }
});

// VERIFY LOGIN OTP — CREATE SESSION ONLY AFTER SUCCESS
router.post("/verify-login-code", authLimiter, async (req, res, next) => {
  try {
    const parsed = verifyEmailSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Enter a valid email and 6-digit verification code.",
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

    if (user.verificationAttempts >= MAX_VERIFICATION_ATTEMPTS) {
      res.status(429).json({
        error: "Too many incorrect codes. Request a new login code.",
      });
      return;
    }

    if (
      !user.verificationCodeHash ||
      !user.verificationCodeExpiresAt ||
      user.verificationCodeExpiresAt.getTime() <= Date.now()
    ) {
      res.status(400).json({
        error: "Your login code has expired. Sign in again to get a new code.",
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

    await regenerateSession(req);
    req.session.userId = String(user._id);
    await saveSession(req);

    res.json({
      message: "Signed in successfully.",
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
});

// REQUEST PASSWORD RESET OTP
router.post("/forgot-password", authLimiter, async (req, res, next) => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Enter a valid email address." });
      return;
    }

    const email = normalizeEmail(parsed.data.email);
    const genericMessage =
      "If an eligible account exists for this email, a password-reset code will be sent.";

    const user = await User.findOne({ email }).select(
      "+passwordResetCodeHash +passwordResetCodeExpiresAt +passwordResetAttempts",
    );

    if (!user || !user.emailVerified) {
      res.json({ message: genericMessage, email });
      return;
    }

    // Enforce a resend cooldown without revealing account details.
    if (
      user.passwordResetCodeExpiresAt &&
      user.passwordResetCodeExpiresAt.getTime() - Date.now() >
        CODE_EXPIRY_MS - RESEND_COOLDOWN_MS
    ) {
      res.json({ message: genericMessage, email });
      return;
    }

    const code = randomInt(100000, 1000000).toString();

    user.passwordResetCodeHash = hashVerificationCode(code);
    user.passwordResetCodeExpiresAt = new Date(Date.now() + CODE_EXPIRY_MS);
    user.passwordResetAttempts = 0;
    user.passwordResetTokenHash = undefined;
    user.passwordResetTokenExpiresAt = undefined;

    await user.save();

    try {
      await sendPasswordResetEmail(email, code);
    } catch (error) {
      user.passwordResetCodeHash = undefined;
      user.passwordResetCodeExpiresAt = undefined;
      user.passwordResetAttempts = 0;
      await user.save();

      console.error("Password-reset email delivery failed:", error);

      res.status(503).json({
        error: "We couldn't send a reset code right now. Please try again later.",
      });
      return;
    }

    res.json({ message: genericMessage, email });
  } catch (error) {
    next(error);
  }
});

// VERIFY PASSWORD RESET OTP — ISSUE SHORT-LIVED RESET TOKEN
router.post("/verify-reset-code", authLimiter, async (req, res, next) => {
  try {
    const parsed = verifyResetCodeSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Enter a valid email and 6-digit reset code.",
      });
      return;
    }

    const email = normalizeEmail(parsed.data.email);
    const submittedHash = hashVerificationCode(parsed.data.code);

    const user = await User.findOne({ email }).select(
      "+passwordResetCodeHash +passwordResetCodeExpiresAt +passwordResetAttempts +passwordResetTokenHash +passwordResetTokenExpiresAt",
    );

    if (
      !user ||
      !user.passwordResetCodeHash ||
      !user.passwordResetCodeExpiresAt ||
      user.passwordResetCodeExpiresAt.getTime() <= Date.now()
    ) {
      res.status(400).json({
        error: "Invalid or expired reset code. Request a new one.",
      });
      return;
    }

    if (user.passwordResetAttempts >= MAX_VERIFICATION_ATTEMPTS) {
      res.status(429).json({
        error: "Too many incorrect codes. Request a new reset code.",
      });
      return;
    }

    if (submittedHash !== user.passwordResetCodeHash) {
      user.passwordResetAttempts += 1;
      await user.save();

      res.status(400).json({
        error: "Invalid or expired reset code.",
        attemptsRemaining: Math.max(
          0,
          MAX_VERIFICATION_ATTEMPTS - user.passwordResetAttempts,
        ),
      });
      return;
    }

    // Generate a token that can be used only for the password-reset endpoint.
    const resetToken = randomBytes(32).toString("hex");

    user.passwordResetCodeHash = undefined;
    user.passwordResetCodeExpiresAt = undefined;
    user.passwordResetAttempts = 0;
    user.passwordResetTokenHash = hashResetToken(resetToken);
    user.passwordResetTokenExpiresAt = new Date(
      Date.now() + RESET_TOKEN_EXPIRY_MS,
    );

    await user.save();

    res.json({
      message: "Code verified. You can now reset your password.",
      email: user.email,
      resetToken,
      expiresInSeconds: RESET_TOKEN_EXPIRY_MS / 1000,
    });
  } catch (error) {
    next(error);
  }
});

// RESET PASSWORD
router.post("/reset-password", authLimiter, async (req, res, next) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: "Check your email, reset token, and new password.",
        fields: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const email = normalizeEmail(parsed.data.email);
    const tokenHash = hashResetToken(parsed.data.resetToken);

    const user = await User.findOne({ email }).select(
      "+passwordHash +passwordResetTokenHash +passwordResetTokenExpiresAt",
    );

    if (
      !user ||
      !user.passwordResetTokenHash ||
      !user.passwordResetTokenExpiresAt ||
      user.passwordResetTokenExpiresAt.getTime() <= Date.now() ||
      user.passwordResetTokenHash !== tokenHash
    ) {
      res.status(400).json({
        error: "Your reset session is invalid or expired. Start again.",
      });
      return;
    }

    user.passwordHash = await bcrypt.hash(parsed.data.password, 12);

    // Make the reset token single-use.
    user.passwordResetCodeHash = undefined;
    user.passwordResetCodeExpiresAt = undefined;
    user.passwordResetAttempts = 0;
    user.passwordResetTokenHash = undefined;
    user.passwordResetTokenExpiresAt = undefined;

    await user.save();

    // Invalidate the current session cookie, if one exists.
    if (req.session) {
      await destroySession(req);
      res.clearCookie("fieldnotes.sid", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }

    res.json({
      message: "Password reset successfully. You can now sign in.",
    });
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
