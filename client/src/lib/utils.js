import clsx from 'clsx';

export const cn = (...a) => clsx(a);

/** Dotted-path helpers: getIn(obj,'a.b.c') / setIn(obj,'a.b.c',v) (immutable). */
export const getIn = (obj, path) => (path ? String(path).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj) : obj);
export function setIn(obj, path, value) {
  const [head, ...rest] = String(path).split('.');
  const base = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  base[head] = rest.length ? setIn(base[head], rest.join('.'), value) : value;
  return base;
}
export const debounce = (fn, ms = 350) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

/** Download rows as a CSV file that opens cleanly in Excel. */
export function downloadCsv(filename, columns, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = columns.map((c) => esc(c.label)).join(',');
  const body = rows.map((r) => columns.map((c) => esc(c.value ? c.value(r) : getIn(r, c.key))).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${head}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
