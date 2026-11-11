import { Router } from 'express';
import { authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { ApiError } from './ApiError.js';
import { isId } from './crud.js';

/**
 * Standard REST routes protected by permission checks + zod validation.
 * `before(router)` can register static routes (e.g. /check-in) ahead of `/:id`.
 */
export function crudRoutes({ crud, module, createSchema, updateSchema, before, readOnly = false }) {
  const r = Router();
  r.param('id', (_req, _res, next, id) => (isId(id) ? next() : next(new ApiError(400, 'Invalid id'))));
  if (before) before(r);
  r.get('/', authorize(module, 'view'), crud.list);
  r.get('/:id', authorize(module, 'view'), crud.get);
  if (!readOnly) {
    r.post('/', authorize(module, 'add'), validate(createSchema), crud.create);
    r.patch('/:id', authorize(module, 'edit'), validate(updateSchema), crud.update);
    r.delete('/:id', authorize(module, 'delete'), crud.remove);
  }
  return r;
}
