import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

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
  FORGET_PASSWORD = 'forgetPassword',
}

export interface Otp {
  code: string;
  type: OtpType;
  expiresIn: Date;
}

export interface ImageData {
  secure_url: string;
  public_id: string;
}

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ enum: Provider, default: Provider.SYSTEM })
  provider: Provider;

  @Prop({ enum: Gender })
  gender: Gender;

  @Prop({
    type: Date,
    required: true,
    validate: {
      validator: function (value: Date) {
        if (!value) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dob = new Date(value);
        dob.setHours(0, 0, 0, 0);
        
        if (dob >= today) return false;
        
        const age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        const dayDiff = today.getDate() - dob.getDate();
        
        const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
        
        return actualAge >= 18;
      },
      message: 'Date of birth must be valid, in the past, and age must be at least 18 years',
    },
  })
  DOB: Date;

  @Prop()
  mobileNumber?: string;

  @Prop({ enum: Role, default: Role.USER })
  role: Role;

  @Prop({ default: false })
  isConfirmed: boolean;

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
        code: { type: String, required: true },
        type: { type: String, enum: Object.values(OtpType), required: true },
        expiresIn: { type: Date, required: true },
      },
    ],
    default: [],
  })
  OTP: Otp[];
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('username').get(function (this: UserDocument) {
  return `${this.firstName}${this.lastName}`;
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const saltRounds = Number(process.env.SALT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(this.password, saltRounds);
    this.password = hashedPassword;
    
    this.changeCredentialTime = new Date();
    next();
  } catch (error) {
    next(error);
  }
});
