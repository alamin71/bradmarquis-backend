import { Model } from 'mongoose';
import { USER_ROLES } from '../../../enums/user';
export type IUser = {
  name: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  role: USER_ROLES;
  email: string;
  password: string;
  profileImage?: string;
  coverPhoto?: string;
  bio?: string;
  gender?: string;
  dateOfBirth?: Date;
  isDeleted: boolean;
  stripeCustomerId: string;
  address: string;
  status: 'active' | 'blocked';
  verified: boolean;
  authentication?: {
    isResetPassword: boolean;
    oneTimeCode: number | null;
    expireAt: Date | null;
    pendingEmail?: string;
    emailChangeOtp?: number | null;
    emailChangeExpireAt?: Date | null;
  };
};

export type UserModel = {
  isExistUserById(id: string): Promise<IUser | null>;
  isExistUserByEmail(email: string): Promise<IUser | null>;
  isExistUserByPhone(contact: string): Promise<IUser | null>;
  isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IUser>;
