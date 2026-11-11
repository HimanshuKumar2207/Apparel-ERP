/**
 * GST calculation for an invoice. All values are integer paise.
 * Booking rates are treated as EXCLUDING GST: tax = taxable x brand GST rate.
 * Same state as the seller -> CGST + SGST (half each); different state -> IGST.
 */
export function computeInvoice(items, gstRateByBrand, intraState) {
  let taxable = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  const lines = items.map((i) => {
    const t = i.amount;
    const rate = gstRateByBrand.get(String(i.brand)) ?? 0;
    const tax = Math.round((t * rate) / 100);
    let c = 0;
    let s = 0;
    let g = 0;
    if (intraState) { c = Math.floor(tax / 2); s = tax - c; } else { g = tax; }
    taxable += t; cgst += c; sgst += s; igst += g;
    return {
      brand: i.brand, subBrand: i.subBrand ?? null, product: i.product ?? null,
      style: i.style, size: i.size, color: i.color, qty: i.qty, rate: i.rate, discountPct: i.discountPct || 0,
      taxable: t, gstRate: rate, cgst: c, sgst: s, igst: g, total: t + tax,
    };
  });
  const grand = taxable + cgst + sgst + igst;
  const total = Math.round(grand / 100) * 100; // round to the nearest rupee
  return { lines, taxable, cgst, sgst, igst, roundOff: total - grand, total };
}

/** Indian financial year label, e.g. April 2026 - March 2027 -> '2026-27'. */
export function financialYear(date = new Date()) {
  const y = date.getFullYear();
  const start = date.getMonth() >= 3 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}
