import 'dotenv/config';
import { z } from 'zod';

const bool = z.enum(['true', 'false']).default('false').transform((v) => v === 'true');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(5000),
  MONGO_URI: z.string().min(1),
  CLIENT_ORIGINS: z.string().default('http://localhost:5173'),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  JWT_ACCESS_SECRET: z.string().min(32, 'must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'must be at least 32 characters'),
  ACCESS_TTL: z.string().default('15m'),
  REFRESH_TTL_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
  FIELD_ENCRYPTION_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/, 'must be 64 hex characters (32 bytes)'),
  REQUIRE_2FA_SUPER_ADMIN: bool,
  MAX_SUPER_ADMINS: z.coerce.number().int().min(1).default(3),
  // Refresh cookie 'Secure' flag. Defaults to true in production (needs HTTPS). Set false only for a local http test.
  COOKIE_SECURE: z.enum(['true', 'false']).optional(),
  // Seller details printed on invoices; COMPANY_STATE decides CGST+SGST (same state) vs IGST (other state).
  COMPANY_NAME: z.string().default('Your Company Name'),
  COMPANY_GSTIN: z.string().default(''),
  COMPANY_STATE: z.string().default('Bihar'),
  COMPANY_ADDRESS: z.string().default(''),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const i of parsed.error.issues) console.error(` - ${i.path.join('.')}: ${i.message}`);
  process.exit(1);
}

const data = parsed.data;
if (data.NODE_ENV === 'production') {
  const weak = [data.JWT_ACCESS_SECRET, data.JWT_REFRESH_SECRET].some((s) => s.includes('change-me'));
  if (weak || /^0+$/.test(data.FIELD_ENCRYPTION_KEY) || data.JWT_ACCESS_SECRET === data.JWT_REFRESH_SECRET) {
    console.error('Refusing to start in production with default or reused secrets. Generate new ones (see .env.example).');
    process.exit(1);
  }
}

export const env = {
  ...data,
  isProd: data.NODE_ENV === 'production',
  isTest: data.NODE_ENV === 'test',
  cookieSecure: data.COOKIE_SECURE ? data.COOKIE_SECURE === 'true' : data.NODE_ENV === 'production',
  clientOrigins: data.CLIENT_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
};
