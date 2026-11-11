import mongoose from 'mongoose';
import { pad } from '../utils/helpers.js';

const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } });
export const Counter = mongoose.model('Counter', counterSchema);

export async function nextSeq(key) {
  const c = await Counter.findOneAndUpdate({ _id: key }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return c.seq;
}

/** nextCode('EMP', 'employee') -> EMP-0001 ;  nextCode('BK-2026-', 'booking-2026', 5) -> BK-2026-00001 */
export async function nextCode(prefix, key = prefix, len = 4) {
  return `${prefix}${pad(await nextSeq(key), len)}`;
}
