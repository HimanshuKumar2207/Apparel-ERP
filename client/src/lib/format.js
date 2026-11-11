const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const num = new Intl.NumberFormat('en-IN');
const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });

/** All money in the API is integer paise. */
export const money = (paise) => (paise == null || paise === '' ? '-' : inr.format(paise / 100));
export const moneyCompact = (paise) => (paise == null ? '-' : `\u20B9${compact.format(paise / 100)}`);
export const number = (n) => (n == null || n === '' ? '-' : num.format(n));
export const percent = (p) => (p == null ? '-' : `${Math.round(p * 10) / 10}%`);

export const date = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');
export const dateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-');
export const timeOnly = (d) => (d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-');
export const monthLabel = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};
export const isoDay = (d = new Date()) => new Date(d).toISOString().slice(0, 10);
export const titleCase = (s) => String(s || '').replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
export const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
