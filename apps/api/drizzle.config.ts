import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(apiRoot, "../..");

config({ path: path.join(monorepoRoot, ".env") });
config({ path: path.join(apiRoot, ".env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for drizzle-kit");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
});
