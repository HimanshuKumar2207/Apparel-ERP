import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { loginLimiter, refreshLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { changePasswordSchema, disable2faSchema, loginSchema, otpSchema } from '../../validators/auth.validators.js';
import * as c from './auth.controller.js';

const r = Router();
r.post('/login', loginLimiter, validate(loginSchema), c.login);
r.post('/refresh', refreshLimiter, c.refresh);
r.post('/logout', c.logout);

r.use(authenticate);
r.get('/me', c.me);
r.post('/logout-all', c.logoutAll);
r.post('/change-password', validate(changePasswordSchema), c.changePassword);
r.post('/2fa/setup', c.setup2fa);
r.post('/2fa/enable', validate(otpSchema), c.enable2fa);
r.post('/2fa/disable', validate(disable2faSchema), c.disable2fa);
export default r;
