import { createCrud } from '../../utils/crud.js';
import { crudRoutes } from '../../utils/crudRoutes.js';
import { AuditLog } from '../../models/AuditLog.js';

const crud = createCrud({
  Model: AuditLog,
  module: 'audit',
  label: 'Audit log',
  searchFields: ['summary', 'userName', 'recordId'],
  filterFields: ['module', 'action', 'user', 'role'],
  defaultSort: '-createdAt',
});
export default crudRoutes({ crud, module: 'audit', readOnly: true });
