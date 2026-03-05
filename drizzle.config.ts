import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgresql://neondb_owner:npg_rlETZ7Pv6mzf@ep-falling-base-aflwqr5u.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require",
  },
});
