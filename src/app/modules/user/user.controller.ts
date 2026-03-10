import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { UserService } from './user.service';
import config from '../../../config';
import bcrypt from 'bcrypt';
import { uploadToS3 } from '../../../helpers/s3Helper';
import AppError from '../../../errors/AppError';
const createUser = catchAsync(async (req, res) => {
  const { ...userData } = req.body;
  const result = await UserService.createUserToDB(userData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User created successfully',
    data: result,
  });
});

const getUserProfile = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await UserService.getUserProfileFromDB(user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Profile data retrieved successfully',
    data: result,
  });
});

//update profile
const updateProfile = catchAsync(async (req, res) => {
  const user = req.user;
  let payload = { ...req.body };

  if (typeof payload?.data === 'string') {
    try {
      payload = {
        ...payload,
        ...JSON.parse(payload.data),
      };
      delete payload.data;
    } catch (error) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid profile data');
    }
  }

  const files = req.files as
    | Express.Multer.File[]
    | { [fieldname: string]: Express.Multer.File[] }
    | undefined;

  let profileImageFile: Express.Multer.File | undefined;
  let coverPhotoFile: Express.Multer.File | undefined;
  if (Array.isArray(files) && files.length > 0) {
    profileImageFile = files.find((file) => file.fieldname === 'profileImage');
    coverPhotoFile = files.find((file) => file.fieldname === 'coverPhoto');
  } else if (files) {
    if ('profileImage' in files && Array.isArray(files.profileImage)) {
      [profileImageFile] = files.profileImage;
    }

    if ('coverPhoto' in files && Array.isArray(files.coverPhoto)) {
      [coverPhotoFile] = files.coverPhoto;
    }
  }

  if (profileImageFile) {
    const s3Url = await uploadToS3(profileImageFile, 'user/profiles');
    payload.profileImage = s3Url;
  }

  if (coverPhotoFile) {
    const s3Url = await uploadToS3(coverPhotoFile, 'user/covers');
    payload.coverPhoto = s3Url;
  }

  const removeProfileImage =
    payload.removeProfileImage === true ||
    payload.removeProfileImage === 'true';
  const removeCoverPhoto =
    payload.removeCoverPhoto === true || payload.removeCoverPhoto === 'true';

  if (removeProfileImage) {
    payload.profileImage = '';
  }

  if (removeCoverPhoto) {
    payload.coverPhoto = '';
  }

  delete payload.removeProfileImage;
  delete payload.removeCoverPhoto;

  if ('role' in payload) {
    delete payload.role;
  }

  if ('email' in payload) {
    delete payload.email;
  }

  // If password is provided
  if (payload.password) {
    payload.password = await bcrypt.hash(
      payload.password,
      Number(config.bcrypt_salt_rounds)
    );
  }

  const result = await UserService.updateProfileToDB(user, payload);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Profile updated successfully',
    data: result,
  });
});
//delete profile
const deleteProfile = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { password } = req.body;
  const isUserVerified = await UserService.verifyUserPassword(id, password);
  if (!isUserVerified) {
    return sendResponse(res, {
      success: false,
      statusCode: StatusCodes.UNAUTHORIZED,
      message: 'Incorrect password. Please try again.',
    });
  }

  const result = await UserService.deleteUser(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Profile deleted successfully',
    data: result,
  });
});

const requestEmailChange = catchAsync(async (req, res) => {
  const user = req.user;
  const payload = req.body;

  const result = await UserService.requestEmailChangeToDB(user, payload);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result?.otp
      ? `Email change OTP sent. [DEV: ${result.otp}]`
      : 'Email change OTP sent successfully',
    data: {
      pendingEmail: result.pendingEmail,
    },
  });
});

const verifyEmailChange = catchAsync(async (req, res) => {
  const user = req.user;
  const payload = req.body;

  const result = await UserService.verifyEmailChangeToDB(user, payload);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Email updated successfully',
    data: result,
  });
});

const resendEmailChangeOtp = catchAsync(async (req, res) => {
  const user = req.user;

  const result = await UserService.resendEmailChangeOtpToDB(user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result?.otp
      ? `Email change OTP resent. [DEV: ${result.otp}]`
      : 'Email change OTP resent successfully',
    data: {
      pendingEmail: result.pendingEmail,
    },
  });
});

const deactivateAccount = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { password } = req.body;

  const result = await UserService.deactivateUserToDB(id, password);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message:
      'Account deactivated successfully. Login again with email/username and password to reactivate.',
    data: result,
  });
});

export const UserController = {
  createUser,
  getUserProfile,
  updateProfile,
  deleteProfile,
  requestEmailChange,
  verifyEmailChange,
  resendEmailChangeOtp,
  deactivateAccount,
};
