import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from '../config/db.js';
import { env } from '../config/env.js';
import { Attendance, Booking, Brand, Employee, Party, Payment, Product, SubBrand, Target, User, nextCode } from '../models/index.js';
import { issueInvoice } from '../services/invoice.service.js';
import { createSuperAdmin } from './helpers.js';

const demo = process.argv.includes('--demo');
if (demo && env.isProd) {
  console.error('Refusing to load demo data in production.');
  process.exit(1);
}

const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];
const daysAgo = (n) => new Date(Date.now() - n * 864e5);

await connectDb();

// ---- 1. Super Admins (always)
const created = [];
const existing = await User.countDocuments({ role: 'superAdmin', isDeleted: false });
for (let i = existing + 1; i <= env.MAX_SUPER_ADMINS; i++) {
  created.push({ email: `superadmin${i}@example.com`, ...(await createSuperAdmin({ name: `Super Admin ${i}`, email: `superadmin${i}@example.com` })) });
}
console.log('\n=== Super Admins ===');
if (!created.length) console.log(`Already ${existing} Super Admin(s) present.`);
for (const c of created) console.log(`${c.email}   temporary password: ${c.password}`);
console.log('(shown once - change at first sign-in; replace the example.com emails with real ones)\n');

// ---- 2. Demo data (optional)
if (demo) {
  if (await Brand.exists({ code: 'URB' })) {
    console.log('Demo data already present, skipping.');
  } else {
    const DEMO_PW = 'Demo@12345678';
    const hash = await bcrypt.hash(DEMO_PW, env.BCRYPT_ROUNDS);

    const brandDefs = [
      { name: 'UrbanFit', code: 'URB', gstRate: 5, defaultDiscount: 8 },
      { name: 'Velvet & Co', code: 'VEL', gstRate: 12, defaultDiscount: 10 },
      { name: 'NorthLine', code: 'NTH', gstRate: 5, defaultDiscount: 6 },
      { name: 'Little Sprout', code: 'LSP', gstRate: 5, defaultDiscount: 5 },
    ];
    const brands = await Brand.insertMany(brandDefs);
    const subs = [];
    for (const b of brands) {
      for (const g of b.code === 'LSP' ? ['kids'] : ['men', 'women']) subs.push({ brand: b._id, name: `${b.name} ${g[0].toUpperCase()}${g.slice(1)}`, gender: g });
    }
    const subBrands = await SubBrand.insertMany(subs);

    const styles = ['Classic Tee', 'Slim Jeans', 'Hoodie', 'Kurta Set', 'Chinos', 'Polo', 'Jacket', 'Dress'];
    const products = await Product.insertMany(
      subBrands.flatMap((sb, i) =>
        [0, 1].map((k) => ({
          brand: sb.brand, subBrand: sb._id, styleCode: `S${i + 1}${k + 1}${rnd(90) + 10}`, name: `${pick(styles)} ${k + 1}`,
          season: k ? 'Autumn/Winter 2026' : 'Spring/Summer 2026', sizes: ['S', 'M', 'L', 'XL'], colors: ['Black', 'Navy', 'Olive'],
          mrp: (rnd(20) + 8) * 10000 - 100, dealerPrice: (rnd(12) + 5) * 10000 - 100,
          stock: ['S', 'M', 'L', 'XL'].map((s) => ({ size: s, color: 'Black', qty: rnd(100) + 250 })),
        })),
      ),
    );

    const empNames = ['Rohit Kumar', 'Sneha Singh', 'Aman Gupta', 'Pooja Sharma', 'Vikash Yadav'];
    const employees = [];
    for (const [i, name] of empNames.entries()) {
      employees.push(await Employee.create({
        code: await nextCode('EMP-', 'employee'), name, designation: i === 0 ? 'Sales Manager' : 'Sales Executive',
        phone: `98${rnd(90000000) + 10000000}`, joiningDate: daysAgo(200 + i * 60),
        brands: [{ brand: brands[i % 4]._id }, { brand: brands[(i + 1) % 4]._id }],
        salary: { basic: 2200000 + i * 200000, allowances: 400000, deductions: 100000 },
      }));
      await User.create({ name, email: `sales${i + 1}@example.com`, role: 'salesperson', employee: employees[i]._id, passwordHash: hash, mustChangePassword: false });
    }
    await User.create({
      name: 'Demo Admin', email: 'admin@example.com', role: 'admin', passwordHash: hash,
      permissions: {
        employees: ['view', 'add', 'edit'], salary: ['view'], attendance: ['view', 'add', 'edit'],
        brands: ['view', 'add', 'edit'], products: ['view', 'add', 'edit'], parties: ['view', 'add', 'edit'],
        bookings: ['view', 'add', 'edit', 'approve'], targets: ['view', 'add', 'edit'], payments: ['view', 'add'], reports: ['view'],
      },
    });

    const regions = [['Patna', 'Patna', 'Bihar'], ['Gaya', 'Patna', 'Bihar'], ['Muzaffarpur', 'Patna', 'Bihar'], ['Ranchi', 'Jharkhand', 'Jharkhand'], ['Jamshedpur', 'Jharkhand', 'Jharkhand'], ['Kolkata', 'Kolkata', 'West Bengal'], ['Howrah', 'Kolkata', 'West Bengal']];
    const partyNames = ['Shree Textiles', 'Raj Garments', 'Fashion Hub', 'Style Corner', 'Mehta Brothers', 'Kapoor Fashions', 'New Look', 'Trend Point', 'Ganga Cloth House', 'Royal Wear'];
    const parties = [];
    for (const [i, name] of partyNames.entries()) {
      const [city, region, state] = regions[i % regions.length];
      const e = employees[i % employees.length];
      parties.push(await Party.create({
        code: await nextCode('PTY-', 'party'), name, city, region, state, gstNumber: `10ABCDE${1000 + i}F1Z5`, creditLimit: (rnd(8) + 4) * 10000000,
        paymentTermsDays: pick([15, 30, 45]), assignedTo: e._id, contacts: [{ name: 'Owner', phone: `97${rnd(90000000) + 10000000}` }],
        brands: e.brands.map((b) => ({ brand: b.brand, discountPct: rnd(6) })),
      }));
    }

    const statuses = ['confirmed', 'confirmed', 'confirmed', 'dispatched', 'delivered', 'booked', 'cancelled'];
    for (let n = 0; n < 70; n++) {
      const party = pick(parties);
      const emp = employees.find((e) => String(e._id) === String(party.assignedTo));
      const links = emp.brands;
      const items = Array.from({ length: rnd(3) + 1 }, () => {
        const link = pick(links);
        const sb = pick(subBrands.filter((s) => String(s.brand) === String(link.brand)));
        // ~1 in 3 lines is linked to a catalog product so invoicing deducts real stock
        const prod = Math.random() < 0.35 ? pick(products.filter((p) => String(p.brand) === String(link.brand))) : null;
        if (prod) return { brand: link.brand, subBrand: prod.subBrand, product: prod._id, style: prod.styleCode, size: pick(['S', 'M', 'L', 'XL']), color: 'Black', qty: rnd(4) + 1, rate: prod.dealerPrice, discountPct: rnd(5) };
        return { brand: link.brand, subBrand: sb._id, style: `${pick(styles)}`, size: pick(['S', 'M', 'L', 'XL']), color: pick(['Black', 'Navy', 'Olive']), qty: (rnd(8) + 1) * 12, rate: (rnd(8) + 4) * 10000 - 100, discountPct: rnd(7) };
      });
      const date = daysAgo(rnd(110));
      await Booking.create({
        bookingNo: await nextCode(`BK-${date.getFullYear()}-`, `booking-${date.getFullYear()}`, 5),
        party: party._id, employee: emp._id, date, deliveryDate: new Date(date.getTime() + 10 * 864e5),
        status: pick(statuses), items, approvalStatus: 'none',
      });
    }
    // Issue invoices for roughly half of the confirmed bookings (stock is deducted for product-linked lines)
    const toInvoice = await Booking.find({ status: { $in: ['confirmed', 'dispatched', 'delivered'] } });
    let invoiced = 0;
    for (const b of toInvoice.filter((_, i) => i % 2 === 0)) {
      try { await issueInvoice(b, null); invoiced++; } catch (e) { console.warn(`  skipped invoice for ${b.bookingNo}: ${e.message}`); }
    }
    console.log(`Issued ${invoiced} demo invoices.`);
    for (let n = 0; n < 25; n++) {
      await Payment.create({ party: pick(parties)._id, amount: (rnd(15) + 2) * 1000000, mode: pick(['bank', 'upi', 'cheque', 'cash']), referenceNo: `REF${rnd(900000) + 100000}`, date: daysAgo(rnd(90)) });
    }

    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
    for (const e of employees) {
      for (const b of e.brands) await Target.create({ employee: e._id, brand: b.brand, periodType: 'month', periodStart: start, periodEnd: end, targetValue: (rnd(6) + 4) * 10000000, targetQty: 600 });
    }
    for (const e of employees) {
      for (let d = 1; d <= Math.min(now.getUTCDate(), 28); d++) {
        const date = `${start.toISOString().slice(0, 8)}${String(d).padStart(2, '0')}`;
        await Attendance.create({ employee: e._id, date, status: Math.random() < 0.9 ? 'present' : pick(['absent', 'halfDay', 'leave']) });
      }
    }

    console.log('=== Demo accounts (password for all: Demo@12345678) ===');
    console.log('admin@example.com      Admin (limited permissions)');
    console.log('sales1..5@example.com  Salespeople');
    console.log('Demo data loaded: 4 brands, sub-brands, products, 5 employees, 10 parties, 70 bookings, GST invoices, payments, targets, attendance.\n');
  }
}

await disconnectDb();
