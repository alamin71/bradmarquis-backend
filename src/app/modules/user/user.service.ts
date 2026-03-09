import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { USER_ROLES } from '../../../enums/user';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import unlinkFile from '../../../shared/unlinkFile';
import { IUser } from './user.interface';
import { User } from './user.model';
import AppError from '../../../errors/AppError';
import generateOTP from '../../../utils/generateOTP';

type IRequestEmailChangePayload = {
  currentPassword: string;
  newEmail: string;
};

type IVerifyEmailChangePayload = {
  otp: number;
};
// create user
const createUserToDB = async (payload: IUser): Promise<IUser> => {
  //set role
  const user = await User.isExistUserByEmail(payload.email);
  if (user) {
    throw new AppError(StatusCodes.CONFLICT, 'Email already exists');
  }
  payload.role = USER_ROLES.USER;
  const createUser = await User.create(payload);
  if (!createUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create user');
  }

  //send email
  const otp = generateOTP(6);
  const values = {
    name: createUser.name,
    otp: otp,
    email: createUser.email!,
  };
  const createAccountTemplate = emailTemplate.createAccount(values);
  emailHelper.sendEmail(createAccountTemplate);

  //save to DB
  const authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 3 * 60000),
  };
  await User.findOneAndUpdate(
    { _id: createUser._id },
    { $set: { authentication } }
  );

  return createUser;
};
// create Admin
// const createAdminToDB = async (
//   payload: Partial<IUser>
// ): Promise<IUser> => {
//   //set role
//   payload.role = USER_ROLES.ADMIN;
//   const createAdmin = await User.create(payload);
//   if (!createAdmin) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create admin');
//   }

//   //send email
//   const otp = generateOTP(6);
//   const values = {
//     name: createAdmin.name,
//     otp: otp,
//     email: createAdmin.email!,
//   };
//   const createAccountTemplate = emailTemplate.createAccount(values);
//   emailHelper.sendEmail(createAccountTemplate);

//   //save to DB
//   const authentication = {
//     oneTimeCode: otp,
//     expireAt: new Date(Date.now() + 3 * 60000),
//   };
//   await User.findOneAndUpdate(
//     { _id: createAdmin._id },
//     { $set: { authentication } }
//   );

//   return createAdmin;
// };

// get user profile
const getUserProfileFromDB = async (
  user: JwtPayload
): Promise<Partial<IUser>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  return isExistUser;
};

// update user profile
const updateProfileToDB = async (
  user: JwtPayload,
  payload: Partial<IUser>
): Promise<Partial<IUser | null>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  //unlink file here
  if (
    payload.profileImage &&
    isExistUser.profileImage &&
    !isExistUser.profileImage.startsWith('http://') &&
    !isExistUser.profileImage.startsWith('https://')
  ) {
    unlinkFile(isExistUser.profileImage);
  }

  if (
    payload.coverPhoto &&
    isExistUser.coverPhoto &&
    !isExistUser.coverPhoto.startsWith('http://') &&
    !isExistUser.coverPhoto.startsWith('https://')
  ) {
    unlinkFile(isExistUser.coverPhoto);
  }

  const hasFirstNameUpdate = Object.prototype.hasOwnProperty.call(
    payload,
    'firstName'
  );
  const hasLastNameUpdate = Object.prototype.hasOwnProperty.call(
    payload,
    'lastName'
  );

  // Keep full name in sync when firstName/lastName changes and name is not sent explicitly.
  if ((hasFirstNameUpdate || hasLastNameUpdate) && !('name' in payload)) {
    const firstName = (payload.firstName ?? isExistUser.firstName ?? '').trim();
    const lastName = (payload.lastName ?? isExistUser.lastName ?? '').trim();
    const fullName = `${firstName} ${lastName}`.trim();

    if (fullName) {
      payload.name = fullName;
    }
  }

  const updateDoc = await User.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });

  return updateDoc;
};

const verifyUserPassword = async (userId: string, password: string) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found.');
  }
  const isPasswordValid = await User.isMatchPassword(password, user.password);
  return isPasswordValid;
};
const deleteUser = async (id: string) => {
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  await User.findByIdAndUpdate(id, {
    $set: { isDeleted: true },
  });

  return true;
};

const requestEmailChangeToDB = async (
  user: JwtPayload,
  payload: IRequestEmailChangePayload
) => {
  const { id } = user;
  const { currentPassword, newEmail } = payload;

  if (!currentPassword) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Current password is required');
  }

  const normalizedNewEmail = newEmail.trim().toLowerCase();
  const existingUser = await User.findById(id).select(
    '+password +authentication'
  );

  if (!existingUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  const isPasswordValid = await User.isMatchPassword(
    currentPassword,
    existingUser.password
  );

  if (!isPasswordValid) {
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      'Current password is incorrect'
    );
  }

  if (existingUser.email === normalizedNewEmail) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'New email must be different from current email'
    );
  }

  const emailAlreadyTaken = await User.findOne({ email: normalizedNewEmail });
  if (emailAlreadyTaken && String(emailAlreadyTaken._id) !== String(id)) {
    throw new AppError(StatusCodes.CONFLICT, 'Email already exists');
  }

  const otp = generateOTP(6);
  const values = { otp, email: normalizedNewEmail };
  const template = emailTemplate.resetPassword(values);
  emailHelper.sendEmail(template);

  await User.findByIdAndUpdate(
    id,
    {
      $set: {
        'authentication.pendingEmail': normalizedNewEmail,
        'authentication.emailChangeOtp': Number(otp),
        'authentication.emailChangeExpireAt': new Date(Date.now() + 5 * 60000),
      },
    },
    { new: true }
  );

  return {
    pendingEmail: normalizedNewEmail,
    otp,
  };
};

const verifyEmailChangeToDB = async (
  user: JwtPayload,
  payload: IVerifyEmailChangePayload
) => {
  const { id } = user;
  const { otp } = payload;

  const existingUser = await User.findById(id).select('+authentication');
  if (!existingUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  const pendingEmail = existingUser.authentication?.pendingEmail?.trim();
  const emailChangeOtp = existingUser.authentication?.emailChangeOtp;
  const emailChangeExpireAt = existingUser.authentication?.emailChangeExpireAt;

  if (!pendingEmail || !emailChangeOtp || !emailChangeExpireAt) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'No pending email change request found'
    );
  }

  if (String(emailChangeOtp) !== String(otp)) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'You provided wrong otp');
  }

  if (new Date() > new Date(emailChangeExpireAt)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'Otp already expired, Please try again'
    );
  }

  const emailAlreadyTaken = await User.findOne({ email: pendingEmail });
  if (emailAlreadyTaken && String(emailAlreadyTaken._id) !== String(id)) {
    throw new AppError(StatusCodes.CONFLICT, 'Email already exists');
  }

  const updatedUser = await User.findByIdAndUpdate(
    id,
    {
      $set: {
        email: pendingEmail,
        'authentication.pendingEmail': '',
        'authentication.emailChangeOtp': null,
        'authentication.emailChangeExpireAt': null,
      },
    },
    { new: true }
  );

  return updatedUser;
};

const resendEmailChangeOtpToDB = async (user: JwtPayload) => {
  const { id } = user;

  const existingUser = await User.findById(id).select('+authentication');
  if (!existingUser) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  const pendingEmail = existingUser.authentication?.pendingEmail?.trim();

  if (!pendingEmail) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      'No pending email change request found'
    );
  }

  const otp = generateOTP(6);
  const values = { otp, email: pendingEmail };
  const template = emailTemplate.resetPassword(values);
  emailHelper.sendEmail(template);

  await User.findByIdAndUpdate(
    id,
    {
      $set: {
        'authentication.emailChangeOtp': Number(otp),
        'authentication.emailChangeExpireAt': new Date(Date.now() + 5 * 60000),
      },
    },
    { new: true }
  );

  return {
    pendingEmail,
    otp,
  };
};

export const UserService = {
  createUserToDB,
  getUserProfileFromDB,
  updateProfileToDB,
  deleteUser,
  verifyUserPassword,
  requestEmailChangeToDB,
  verifyEmailChangeToDB,
  resendEmailChangeOtpToDB,
};
