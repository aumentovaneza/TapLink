import { z } from "zod";

function emptyStringToUndefined(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  SUPABASE_URL: z.preprocess(emptyStringToUndefined, z.string().url().optional()),
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(emptyStringToUndefined, z.string().min(1).optional()),
  SUPABASE_STORAGE_BUCKET: z.preprocess(emptyStringToUndefined, z.string().min(1).default("profile-photos")),
  PHOTO_UPLOAD_MAX_BYTES: z.coerce.number().int().min(1_000_000).max(20_000_000).default(8_000_000),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(): AppConfig {
  return envSchema.parse(process.env);
}
