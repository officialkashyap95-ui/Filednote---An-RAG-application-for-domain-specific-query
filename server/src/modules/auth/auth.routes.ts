
import { Router } from "express";
import bcrypt from "bcryptjs";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
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

const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  password: z.string().min(6).max(128),
  confirmPassword: z.string().min(6).max(128),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match.",
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function publicUser(user: {
  _id: unknown;
  name: string;
  email: string;
}) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
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
        error: "An account with these details cannot be created. Try signing in.",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let user;
    try {
      user = await User.create({ name, email, passwordHash });
    } catch (error: unknown) {
      // The unique database index handles concurrent sign-up attempts.
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        res.status(409).json({
          error: "An account with these details cannot be created. Try signing in.",
        });
        return;
      }
      throw error;
    }

    await regenerateSession(req);
    req.session.userId = String(user._id);
    await saveSession(req);

    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid email or password." });
      return;
    }

    const email = normalizeEmail(parsed.data.email);

    const user = await User.findOne({ email }).select("+passwordHash");

    // Use the same message for unknown emails and wrong passwords.
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

    await regenerateSession(req);
    req.session.userId = String(user._id);
    await saveSession(req);

    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.get("/me", async (req, res, next) => {
  try {
    if (!req.session.userId) {
      res.status(401).json({ error: "Not signed in." });
      return;
    }

    const user = await User.findById(req.session.userId);

    if (!user) {
      req.session.destroy(() => {});
      res.status(401).json({ error: "Not signed in." });
      return;
    }

    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

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
