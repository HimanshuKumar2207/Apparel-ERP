import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export function strongPassword() {
  const pick = (s) => s[crypto.randomInt(s.length)];
  const all = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*';
  let p = pick('ABCDEFGHJKLMNPQRSTUVWXYZ') + pick('abcdefghijkmnpqrstuvwxyz') + pick('23456789') + pick('!@#$%^&*');
  while (p.length < 16) p += pick(all);
  return [...p].sort(() => crypto.randomInt(3) - 1).join('');
}

/** Creates a Super Admin, enforcing the configured maximum (default 3). */
export async function createSuperAdmin({ name, email, password }) {
  const count = await User.countDocuments({ role: 'superAdmin', isDeleted: false });
  if (count >= env.MAX_SUPER_ADMINS) throw new Error(`Limit reached: there are already ${count} Super Admins (max ${env.MAX_SUPER_ADMINS}).`);
  if (await User.exists({ email: email.toLowerCase() })) throw new Error(`A user with ${email} already exists.`);
  const pw = password || strongPassword();
  const user = await User.create({
    name,
    email,
    role: 'superAdmin',
    passwordHash: await bcrypt.hash(pw, env.BCRYPT_ROUNDS),
    mustChangePassword: true,
  });
  return { user, password: pw };
}
