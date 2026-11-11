import mongoose from 'mongoose';
import { ApiError } from './ApiError.js';
import { asyncHandler } from './asyncHandler.js';
import { escapeRegex } from './helpers.js';
import { scopeFilter } from '../services/scope.service.js';
import { audit } from '../services/audit.service.js';

const SORT_RE = /^-?[a-zA-Z0-9_.]+$/;

/**
 * Generic, scope-aware CRUD handlers (list / get / create / update / remove).
 * Every handler applies: soft-delete filter + role scope + audit logging.
 */
export function createCrud({
  Model,
  module,
  scopeKey = module,
  label = module,
  searchFields = [],
  filterFields = [],
  populate = [],
  defaultSort = '-createdAt',
  mergeKeys = [],
  extraFilter = {},
  decorate, // async (plainItems, req) => items
  beforeCreate, // async (data, req)
  beforeUpdate, // async (data, req, doc)
  afterSave, // async (doc, req, { created })
  afterRemove, // async (doc, req)
}) {
  const soft = Boolean(Model.schema.path('isDeleted'));
  const baseFilter = () => ({ ...(soft ? { isDeleted: false } : {}), ...extraFilter });

  async function findScoped(req, id) {
    const scope = await scopeFilter(req.user, scopeKey);
    const doc = await Model.findOne({ $and: [{ _id: id }, baseFilter(), scope] });
    if (!doc) throw new ApiError(404, `${label} not found`);
    return doc;
  }

  const present = async (docs, req) => {
    const arr = Array.isArray(docs) ? docs : [docs];
    if (populate.length) await Model.populate(arr, populate);
    let plain = arr.map((d) => d.toJSON());
    if (decorate) plain = await decorate(plain, req);
    return Array.isArray(docs) ? plain : plain[0];
  };

  const list = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const sortParam = typeof req.query.sort === 'string' && SORT_RE.test(req.query.sort) ? req.query.sort : defaultSort;

    const conditions = [baseFilter(), await scopeFilter(req.user, scopeKey)];
    for (const f of filterFields) {
      const v = req.query[f];
      if (typeof v === 'string' && v !== '') conditions.push({ [f]: v });
    }
    if (typeof req.query.q === 'string' && req.query.q.trim() && searchFields.length) {
      const rx = new RegExp(escapeRegex(req.query.q.trim().slice(0, 60)), 'i');
      conditions.push({ $or: searchFields.map((f) => ({ [f]: rx })) });
    }
    const filter = { $and: conditions };

    const [docs, total] = await Promise.all([
      Model.find(filter).sort(sortParam).skip((page - 1) * limit).limit(limit),
      Model.countDocuments(filter),
    ]);
    res.json({ data: await present(docs, req), meta: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
  });

  const get = asyncHandler(async (req, res) => {
    res.json({ data: await present(await findScoped(req, req.params.id), req) });
  });

  const create = asyncHandler(async (req, res) => {
    const data = { ...req.body };
    if (beforeCreate) await beforeCreate(data, req);
    const doc = await Model.create({ ...data, createdBy: req.user._id, updatedBy: req.user._id });
    if (afterSave) await afterSave(doc, req, { created: true });
    const out = await present(doc, req);
    await audit(req, { action: 'create', module, recordId: doc._id, summary: `Created ${label}`, after: out });
    res.status(201).json({ data: out });
  });

  const update = asyncHandler(async (req, res) => {
    const doc = await findScoped(req, req.params.id);
    const before = doc.toJSON();
    const data = { ...req.body };
    if (beforeUpdate) await beforeUpdate(data, req, doc);
    for (const key of mergeKeys) {
      if (data[key] && typeof data[key] === 'object') {
        for (const [k, v] of Object.entries(data[key])) doc.set(`${key}.${k}`, v);
        delete data[key];
      }
    }
    doc.set({ ...data, updatedBy: req.user._id });
    await doc.save();
    if (afterSave) await afterSave(doc, req, { created: false });
    const out = await present(doc, req);
    await audit(req, { action: 'update', module, recordId: doc._id, summary: `Updated ${label}`, before, after: out });
    res.json({ data: out });
  });

  const remove = asyncHandler(async (req, res) => {
    const doc = await findScoped(req, req.params.id);
    const before = doc.toJSON();
    if (soft) {
      doc.isDeleted = true;
      doc.updatedBy = req.user._id;
      await doc.save();
    } else {
      await doc.deleteOne();
    }
    if (afterRemove) await afterRemove(doc, req);
    await audit(req, { action: 'delete', module, recordId: doc._id, summary: `Deleted ${label}`, before });
    res.json({ message: `${label} deleted` });
  });

  return { list, get, create, update, remove, findScoped, present };
}

export const isId = (id) => mongoose.isValidObjectId(id);
