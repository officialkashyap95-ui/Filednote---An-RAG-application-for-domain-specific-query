
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { sessionMiddleware } from "./config/session.js";
import authRoutes from "./modules/auth/auth.routes.js";

const app = express();

const clientOrigin =
  process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type"],
  }),
);

app.use(express.json({ limit: "20kb" }));

app.use((req, res, next) => {
  const unsafeMethod = !["GET", "HEAD", "OPTIONS"].includes(req.method);

  if (unsafeMethod && req.get("origin") !== clientOrigin) {
    res.status(403).json({ error: "Request origin not allowed." });
    return;
  }

  next();
});

app.use(sessionMiddleware);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);

export default app;
