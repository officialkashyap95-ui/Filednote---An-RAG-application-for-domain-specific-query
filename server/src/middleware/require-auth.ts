
import type { Request, Response, NextFunction } from "express";

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.session.userId) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  next();
}
