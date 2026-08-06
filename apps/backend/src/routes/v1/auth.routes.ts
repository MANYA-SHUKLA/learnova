import { Router } from 'express';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerInstitutionSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  sessionIdParamsSchema,
  verifyEmailSchema,
} from '@learnova/validation';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  authenticate,
  optionalAuthenticate,
} from '../../middlewares/auth.middleware.js';
import { createAuthRateLimiter } from '../../middlewares/rate-limit.middleware.js';
import * as authController from '../../controllers/auth/auth.controller.js';

const authRoutes = Router();
const authLimiter = createAuthRateLimiter();

authRoutes.post(
  '/register',
  authLimiter,
  validate(registerInstitutionSchema),
  authController.register,
);

authRoutes.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login,
);

authRoutes.post('/logout', authenticate({ required: true }), authController.logout);
authRoutes.post(
  '/logout-all',
  authenticate({ required: true }),
  authController.logoutAll,
);

authRoutes.post('/refresh', authLimiter, optionalAuthenticate(), authController.refresh);

authRoutes.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

authRoutes.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword,
);

authRoutes.post(
  '/change-password',
  authenticate({ required: true }),
  validate(changePasswordSchema),
  authController.changePassword,
);

authRoutes.post(
  '/verify-email',
  authLimiter,
  validate(verifyEmailSchema),
  authController.verifyEmail,
);

authRoutes.post(
  '/resend-verification',
  authLimiter,
  validate(resendVerificationSchema),
  authController.resendVerification,
);

authRoutes.get('/me', authenticate({ required: true }), authController.me);
authRoutes.get(
  '/session',
  authenticate({ required: true }),
  authController.currentSession,
);
authRoutes.get(
  '/sessions',
  authenticate({ required: true }),
  authController.listSessions,
);
authRoutes.delete(
  '/sessions/:id',
  authenticate({ required: true }),
  validate(sessionIdParamsSchema, 'params'),
  authController.revokeSession,
);

export default authRoutes;
