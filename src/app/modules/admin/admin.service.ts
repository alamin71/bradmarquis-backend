import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { IUser } from '../user/user.interface';
import { User } from '../user/user.model';
import { JwtPayload } from 'jsonwebtoken';
import { AuthService } from '../auth/auth.service';
import { USER_ROLES } from '../../../enums/user';
import {
  IAuthResetPassword,
  IChangePassword,
  IVerifyEmail,
} from '../../../types/auth';

type IAdminLoginData = {
  email: string;
  password: string;
};

const ensureAdminUserByEmail = async (email: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  if (![USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN].includes(user.role as any)) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      'This account is not authorized for admin operations'
    );
  }

  return user;
};

const createAdminToDB = async (payload: IUser): Promise<IUser> => {
  const createAdmin = await User.create(payload);
  if (!createAdmin) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create Admin');
  }
  if (createAdmin) {
    await User.findByIdAndUpdate(
      { _id: createAdmin?._id },
      { verified: true },
      { new: true }
    );
  }
  return createAdmin;
};

const deleteAdminFromDB = async (id: string): Promise<IUser | undefined> => {
  const isExistAdmin = await User.findByIdAndDelete(id);
  if (!isExistAdmin) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to delete Admin');
  }
  return;
};

const getAdminFromDB = async (): Promise<IUser[]> => {
  const admins = await User.find({ role: 'ADMIN' }).select(
    'name email profile contact location'
  );
  return admins;
};

// Get Admin Profile
const getAdminProfileFromDB = async (admin: JwtPayload) => {
  const adminData = await User.findById(admin.id);
  if (!adminData) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Admin not found');
  }
  return adminData;
};

// Update Admin Profile
const updateAdminProfileInDB = async (
  admin: JwtPayload,
  payload: Partial<IUser>
) => {
  // Prevent role change
  if ('role' in payload) {
    delete payload.role;
  }

  const updatedAdmin = await User.findByIdAndUpdate(admin.id, payload, {
    new: true,
    runValidators: true,
  });

  if (!updatedAdmin) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Admin not found');
  }

  return updatedAdmin;
};

const adminLoginToDB = async (payload: IAdminLoginData) => {
  await ensureAdminUserByEmail(payload.email);

  const tokens = await AuthService.loginUserFromDB(payload);
  const admin = await User.findOne({ email: payload.email }).select(
    'name userName email role image verified isEmailVerified authProvider status'
  );

  return {
    ...tokens,
    admin,
  };
};

const adminForgetPasswordToDB = async (email: string) => {
  await ensureAdminUserByEmail(email);
  return AuthService.forgetPasswordToDB(email);
};

const adminVerifyResetOtpToDB = async (payload: IVerifyEmail) => {
  await ensureAdminUserByEmail(payload.email);
  return AuthService.verifyEmailToDB(payload);
};

const adminResetPasswordToDB = async (
  token: string,
  payload: IAuthResetPassword
) => {
  return AuthService.resetPasswordToDB(token, payload);
};

const adminResendOtpToDB = async (email: string) => {
  await ensureAdminUserByEmail(email);
  return AuthService.resendOtpFromDb(email, false);
};

const changePasswordForAdminInDB = async (
  admin: JwtPayload,
  payload: IChangePassword
) => {
  return AuthService.changePasswordToDB(admin, payload);
};

export const AdminService = {
  createAdminToDB,
  deleteAdminFromDB,
  getAdminFromDB,
  getAdminProfileFromDB,
  updateAdminProfileInDB,
  adminLoginToDB,
  adminForgetPasswordToDB,
  adminVerifyResetOtpToDB,
  adminResetPasswordToDB,
  adminResendOtpToDB,
  changePasswordForAdminInDB,
};
