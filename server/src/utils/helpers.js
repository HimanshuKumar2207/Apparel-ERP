import mongoose from 'mongoose';

export const oid = (v) => new mongoose.Types.ObjectId(String(v?._id ?? v));
export const idOf = (v) => (v && v._id ? v._id : v);
export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const pad = (n, len = 4) => String(n).padStart(len, '0');
export const endOfDay = (d) => { const x = new Date(d); x.setUTCHours(23, 59, 59, 999); return x; };
export const monthKeyOf = (d) => new Date(d).toISOString().slice(0, 7);
export const round = (n) => Math.round(Number(n) || 0);
