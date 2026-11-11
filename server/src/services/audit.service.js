import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';

/** Fire-and-forget audit entry. Never throws into the request. */
export async function audit(req, { action, module, recordId, summary, before, after, actor }) {
  try {
    const u = actor || req.user;
    await AuditLog.create({
      user: u?._id,
      userName: u?.name,
      role: u?.role,
      action,
      module,
      recordId: recordId ? String(recordId) : undefined,
      summary,
      before,
      after,
      ip: req.ip,
      userAgent: req.get?.('user-agent')?.slice(0, 200),
    });
  } catch (e) {
    logger.error('audit write failed', e.message);
  }
}
