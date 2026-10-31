import "server-only";
import { z } from "zod";

const schema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
  STYLORA_WORKSPACE_ID: z
    .uuid()
    .default("00000000-0000-4000-8000-000000000001"),
  DEMO_WRITES_ENABLED: z.enum(["true", "false"]).default("false"),
});

export function isDatabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

// Lazy validation: a clean checkout can build without production credentials.
export function getServerEnv() {
  const result = schema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    STYLORA_WORKSPACE_ID: process.env.STYLORA_WORKSPACE_ID || undefined,
    DEMO_WRITES_ENABLED: process.env.DEMO_WRITES_ENABLED || undefined,
  });
  if (!result.success)
    throw new Error("Konfigurasi server belum valid. Periksa .env.example.");
  return result.data;
}
