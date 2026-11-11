import { connectDb, disconnectDb } from '../config/db.js';
import '../models/index.js';
import { createSuperAdmin } from './helpers.js';

// Usage: npm run create-super-admin -- --name "Asha Verma" --email asha@company.com
const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : undefined; };
const name = arg('name');
const email = arg('email');
if (!name || !email) {
  console.error('Usage: npm run create-super-admin -- --name "Full Name" --email you@company.com');
  process.exit(1);
}

await connectDb();
try {
  const { password } = await createSuperAdmin({ name, email });
  console.log(`\nSuper Admin created: ${email}\nTemporary password (shown once): ${password}\nThey must change it at first sign-in.\n`);
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
await disconnectDb();
