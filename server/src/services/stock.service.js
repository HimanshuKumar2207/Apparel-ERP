import { ApiError } from '../utils/ApiError.js';
import { Product } from '../models/Product.js';

/**
 * Stock lives in product.stock[] as { size, color, qty } rows.
 * Updates target the row by index, and the filter re-checks size, color and (for deductions) qty >= needed,
 * so the change is atomic: two invoices racing for the last pieces cannot both succeed, and a re-ordered
 * array makes the filter fail instead of touching the wrong row.
 */
async function locate(productId, size, color) {
  const p = await Product.findOne({ _id: productId, isDeleted: false }).select('styleCode stock');
  const idx = p ? p.stock.findIndex((s) => s.size === size && s.color === color) : -1;
  return { p, idx };
}

/** All-or-nothing deduction for lines that reference a product. Earlier deductions are restored on failure. */
export async function deductStock(lines) {
  const applied = [];
  for (const l of lines.filter((x) => x.product && x.qty > 0)) {
    const { p, idx } = await locate(l.product, l.size, l.color);
    let ok = false;
    if (idx >= 0) {
      const r = await Product.updateOne(
        { _id: l.product, [`stock.${idx}.size`]: l.size, [`stock.${idx}.color`]: l.color, [`stock.${idx}.qty`]: { $gte: l.qty } },
        { $inc: { [`stock.${idx}.qty`]: -l.qty } },
      );
      ok = r.modifiedCount === 1;
    }
    if (!ok) {
      await restoreStock(applied);
      const fresh = (await locate(l.product, l.size, l.color));
      const have = fresh.idx >= 0 ? fresh.p.stock[fresh.idx].qty : 0;
      throw new ApiError(409, `Not enough stock for ${p?.styleCode || l.style} ${l.size}/${l.color}: available ${have}, needed ${l.qty}`, { code: 'INSUFFICIENT_STOCK' });
    }
    applied.push(l);
  }
  return applied;
}

export async function restoreStock(lines) {
  for (const l of lines.filter((x) => x.product && x.qty > 0)) {
    const { idx } = await locate(l.product, l.size, l.color);
    if (idx < 0) continue;
    await Product.updateOne(
      { _id: l.product, [`stock.${idx}.size`]: l.size, [`stock.${idx}.color`]: l.color },
      { $inc: { [`stock.${idx}.qty`]: l.qty } },
    );
  }
}
