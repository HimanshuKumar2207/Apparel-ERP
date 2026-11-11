import './setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';

const { can, effectivePermissions } = await import('../src/services/permissions.service.js');
const { incentiveRate, incentiveFor } = await import('../src/services/incentive.service.js');
const { encrypt, decrypt } = await import('../src/utils/crypto.js');
const { password } = await import('../src/validators/common.js');
const { bookingSchema } = await import('../src/validators/sales.validators.js');
const { createAdminSchema } = await import('../src/validators/admin.validators.js');
const { Booking } = await import('../src/models/Booking.js');

test('super admin can do everything, admin only what is granted, salesperson is limited', () => {
  assert.equal(can({ role: 'superAdmin' }, 'audit', 'view'), true);
  const admin = { role: 'admin', permissions: { bookings: ['view', 'add'] } };
  assert.equal(can(admin, 'bookings', 'add'), true);
  assert.equal(can(admin, 'bookings', 'delete'), false);
  assert.equal(can(admin, 'salary', 'view'), false);
  assert.equal(can(admin, 'audit', 'view'), false);
  const sp = { role: 'salesperson' };
  assert.equal(can(sp, 'bookings', 'add'), true);
  assert.equal(can(sp, 'bookings', 'approve'), false);
  assert.equal(can(sp, 'admins', 'view'), false);
  assert.equal(effectivePermissions(sp).employees.join(), 'view');
});

test('incentive slabs', () => {
  assert.equal(incentiveRate(50), 0);
  assert.equal(incentiveRate(80), 0.01);
  assert.equal(incentiveRate(120), 0.02);
  assert.equal(incentiveFor(1000000, 100), 20000);
});

test('field encryption round-trips and is non-deterministic', () => {
  const a = encrypt('123456789012');
  assert.notEqual(a, encrypt('123456789012'));
  assert.equal(decrypt(a), '123456789012');
  assert.throws(() => decrypt(a.replace(/.$/, 'A') + 'x'));
});

test('password policy', () => {
  assert.equal(password.safeParse('short').success, false);
  assert.equal(password.safeParse('alllowercase123!').success, false);
  assert.equal(password.safeParse('Str0ng!Passw0rd').success, true);
});

test('admin permissions cannot include super-admin-only modules', () => {
  const base = { name: 'Test Admin', email: 'a@b.co', password: 'Str0ng!Passw0rd' };
  assert.equal(createAdminSchema.safeParse({ ...base, permissions: { audit: ['view'] } }).success, false);
  assert.equal(createAdminSchema.safeParse({ ...base, permissions: { bookings: ['view'] } }).success, true);
});

test('booking validation rejects bad items and mass-assignment of status/amount', () => {
  const ok = { party: 'a'.repeat(24), date: '2026-10-01', items: [{ brand: 'b'.repeat(24), qty: 2, rate: 10000 }] };
  assert.equal(bookingSchema.safeParse(ok).success, true);
  assert.equal(bookingSchema.safeParse({ ...ok, items: [] }).success, false);
  const parsed = bookingSchema.parse({ ...ok, totalAmount: 1, approvalStatus: 'approved' });
  assert.equal(parsed.totalAmount, undefined); // stripped: totals are server-computed
  assert.equal(parsed.approvalStatus, undefined); // stripped: cannot self-approve
  assert.equal(bookingSchema.safeParse({ ...ok, status: 'confirmed' }).success, false); // cannot create as confirmed
});

test('booking totals are computed on the server', async () => {
  const b = new Booking({
    bookingNo: 'T-1', party: '1'.repeat(24), employee: '2'.repeat(24), date: new Date('2026-10-01'),
    items: [{ brand: '3'.repeat(24), qty: 10, rate: 10000, discountPct: 10 }, { brand: '4'.repeat(24), qty: 5, rate: 20000 }],
  });
  await b.validate();
  assert.equal(b.items[0].amount, 90000);
  assert.equal(b.totalAmount, 190000);
  assert.equal(b.totalQty, 15);
  assert.equal(b.brands.length, 2);
  assert.equal(b.monthKey, '2026-10');
});

const { computeInvoice, financialYear } = await import('../src/services/gst.service.js');

test('GST: same state splits into CGST+SGST, other state is IGST, totals round to the rupee', () => {
  const items = [{ brand: 'b1', qty: 10, rate: 10000, amount: 100000 }, { brand: 'b2', qty: 1, rate: 3333, amount: 3333 }];
  const rates = new Map([['b1', 12], ['b2', 5]]);
  const intra = computeInvoice(items, rates, true);
  assert.equal(intra.igst, 0);
  assert.equal(intra.cgst + intra.sgst, 12000 + Math.round(3333 * 0.05)); // 12000 + 167
  assert.equal(intra.taxable, 103333);
  assert.equal(intra.total % 100, 0); // whole rupees
  assert.equal(intra.total, intra.taxable + intra.cgst + intra.sgst + intra.igst + intra.roundOff);
  const inter = computeInvoice(items, rates, false);
  assert.equal(inter.cgst + inter.sgst, 0);
  assert.equal(inter.igst, intra.cgst + intra.sgst);
});

test('financial year runs April to March', () => {
  assert.equal(financialYear(new Date(2026, 3, 1)), '2026-27');
  assert.equal(financialYear(new Date(2027, 2, 31)), '2026-27');
  assert.equal(financialYear(new Date(2026, 9, 5)), '2026-27');
});

test('salesperson can view invoices but not create or cancel them', () => {
  const sp = { role: 'salesperson' };
  assert.equal(can(sp, 'invoices', 'view'), true);
  assert.equal(can(sp, 'invoices', 'add'), false);
  assert.equal(can(sp, 'invoices', 'approve'), false);
});
