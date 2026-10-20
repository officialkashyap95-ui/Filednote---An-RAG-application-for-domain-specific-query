
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.resolve(currentDir, "../.env.local"),
});

async function startServer() {
  const mongoUrl = process.env.MONGODB_URI;

  if (!mongoUrl) {
    throw new Error("Missing MONGODB_URI in server/.env.local");
  }

  await mongoose.connect(mongoUrl);

  const { default: app } = await import("./app.js");
  const port = Number(process.env.PORT ?? 4000);

  const server = app.listen(port, () => {
    console.log(`Fieldnotes API listening on http://localhost:${port}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
