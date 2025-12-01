import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export type UserDocument = User & Document;

export enum Provider {
  GOOGLE = 'google',
  SYSTEM = 'system',
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
}

export enum Role {
  USER = 'User',
  ADMIN = 'Admin',
}

export enum OtpType {
  CONFIRM_EMAIL = 'confirmEmail',
  RESET_PASSWORD = 'resetPassword',
}

export interface Otp {
  value: string;
  type: OtpType;
  expiresAt: Date;
}

export interface ImageData {
  secure_url: string;
  public_id: string;
}

const DEFAULT_CRYPTO_KEY = 'default_32_character_crypto_key_1234';
const CRYPTO_ALGORITHM = 'aes-256-cbc';

function decryptMobile(value?: string | null): string | null | undefined {
  if (!value || !value.includes(':')) {
    return value;
  }

  try {
    const cryptoKey = process.env.CRYPTO_KEY || DEFAULT_CRYPTO_KEY;
    const key = crypto.scryptSync(cryptoKey, 'salt', 32);
    const [ivHex, encrypted] = value.split(':');
    const iv = Buffer.from(ivHex, 'hex');

    const decipher = crypto.createDecipheriv(CRYPTO_ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    return value;
  }
}

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.mobileNumber = decryptMobile(ret.mobileNumber);
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (_doc, ret) => {
      ret.mobileNumber = decryptMobile(ret.mobileNumber);
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ select: false })
  password?: string;

  @Prop({ enum: Provider, default: Provider.SYSTEM })
  provider: Provider;

  @Prop({ enum: Gender })
  gender: Gender;

  @Prop({
    type: Date,
    required: false,
    validate: {
      validator: function (this: User & Document, value: Date | null | undefined) {
        const provider = this.provider || Provider.SYSTEM;
        if (provider === Provider.GOOGLE) {
          return true;
        }

        if (!value) {
          return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dob = new Date(value);
        dob.setHours(0, 0, 0, 0);

        if (dob >= today) return false;

        const age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        const dayDiff = today.getDate() - dob.getDate();

        const actualAge =
          monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

        return actualAge >= 18;
      },
      message:
        'Date of birth must be valid, in the past, and age must be at least 18 years',
    },
  })
  DOB?: Date;

  @Prop()
  mobileNumber?: string;

  @Prop({ enum: Role, default: Role.USER })
  role: Role;

  @Prop({ default: false })
  emailConfirmed: boolean;

  @Prop({ select: false })
  refreshTokenHash?: string;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  @Prop({ type: Date, default: null })
  bannedAt: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  updatedBy: Types.ObjectId | null;

  @Prop({ type: Date, default: Date.now })
  changeCredentialTime: Date;

  @Prop({
    type: {
      secure_url: String,
      public_id: String,
    },
    default: null,
  })
  profilePic: ImageData | null;

  @Prop({
    type: {
      secure_url: String,
      public_id: String,
    },
    default: null,
  })
  coverPic: ImageData | null;

  @Prop({
    type: [
      {
        value: { type: String, required: true },
        type: { type: String, enum: Object.values(OtpType), required: true },
        expiresAt: { type: Date, required: true },
      },
    ],
    default: [],
  })
  otp: Otp[];
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('username').get(function (this: UserDocument) {
  return `${this.firstName}${this.lastName}`;
});

UserSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    try {
      const saltRounds = Number(process.env.SALT_ROUNDS) || 10;
      const hashedPassword = await bcrypt.hash(this.password, saltRounds);
      this.password = hashedPassword;
      this.changeCredentialTime = new Date();
    } catch (error) {
      return next(error);
    }
  }
  next();
});

UserSchema.pre('save', async function (next) {
  if (this.isModified('mobileNumber') && this.mobileNumber) {
    try {
      if (this.mobileNumber.includes(':')) {
        return next();
      }
      
      const cryptoKey = process.env.CRYPTO_KEY || 'default_32_character_crypto_key_1234';
      const algorithm = 'aes-256-cbc';
      const ivLength = 16;
      const key = crypto.scryptSync(cryptoKey, 'salt', 32);
      const iv = crypto.randomBytes(ivLength);
      
      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(this.mobileNumber, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      this.mobileNumber = iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      return next(error);
    }
  }
  next();
});
