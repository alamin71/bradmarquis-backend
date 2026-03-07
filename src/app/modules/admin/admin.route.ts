import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { AdminController } from './admin.controller';
import { AdminValidation } from './admin.validation';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { s3FileUploadHandler } from '../../middleware/s3FileUploadHandler';
const router = express.Router();
const adminUpload = s3FileUploadHandler;

// Admin login - returns admin data
router.post(
  '/login',
  validateRequest(AdminValidation.createLoginZodSchema),
  AdminController.adminLogin
);

// Admin password reset (OTP-based) - returns admin data
router.post(
  '/forget-password',
  validateRequest(AdminValidation.createForgetPasswordZodSchema),
  AdminController.adminForgetPassword
);
router.post(
  '/verify-reset-otp',
  validateRequest(AdminValidation.createVerifyResetOtpZodSchema),
  AdminController.adminVerifyResetOtp
);
router.post(
  '/reset-password',
  validateRequest(AdminValidation.createResetPasswordZodSchema),
  AdminController.adminResetPassword
);

// Admin password change (logged in only) - returns admin data
router.patch(
  '/change-password',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  validateRequest(AdminValidation.createChangePasswordZodSchema),
  AdminController.changePassword
);

// Admin resend OTP - returns admin data
router.post(
  '/resend-otp',
  validateRequest(AdminValidation.createResendOtpZodSchema),
  AdminController.adminResendOtp
);

// ============================================
// ADMIN MANAGEMENT ENDPOINTS
// ============================================

router.get(
  '/get-admin',
  auth(USER_ROLES.SUPER_ADMIN),
  AdminController.getAdmin
);

router.get(
  '/profile',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  AdminController.getAdminProfile
);

router.patch(
  '/profile/update',
  auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
  adminUpload.fields([{ name: 'image', maxCount: 1 }]),
  AdminController.updateAdminProfile
);

router.delete(
  '/:id',
  auth(USER_ROLES.SUPER_ADMIN),
  AdminController.deleteAdmin
);

export const AdminRoutes = router;
