
import session from "express-session";
import MongoStore from "connect-mongo";

const mongoUrl = process.env.MONGODB_URI;
const sessionSecret = process.env.SESSION_SECRET;

if (!mongoUrl) {
  throw new Error("Missing MONGODB_URI in server/.env.local");
}

if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error(
    "SESSION_SECRET must be a strong random secret of at least 32 characters.",
  );
}

export const sessionMiddleware = session({
  name: "fieldnotes.sid",
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  store: MongoStore.create({
    mongoUrl,
    collectionName: "sessions",
    ttl: 60 * 60 * 24 * 7,
    autoRemove: "native",
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
    path: "/",
  },
});
