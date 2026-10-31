import "server-only";
import { z } from "zod";

const schema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
  MODEL_API_KEY: z.string().min(1).optional(),
  STYLORA_WORKSPACE_ID: z
    .uuid()
    .default("00000000-0000-4000-8000-000000000001"),
  DEMO_WRITES_ENABLED: z.enum(["true", "false"]).default("false"),
});

export function isDatabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

export function isMuseConfigured() {
  return Boolean(process.env.MODEL_API_KEY);
}

export function getMuseApiKey() {
  return process.env.MODEL_API_KEY;
}

// Lazy validation: a clean checkout can build without production credentials.
export function getServerEnv() {
  const result = schema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    MODEL_API_KEY: process.env.MODEL_API_KEY || undefined,
    STYLORA_WORKSPACE_ID: process.env.STYLORA_WORKSPACE_ID || undefined,
    DEMO_WRITES_ENABLED: process.env.DEMO_WRITES_ENABLED || undefined,
  });
  if (!result.success)
    throw new Error("Invalid server configuration. See .env.example.");
  return result.data;
}
