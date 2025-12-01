import * as crypto from 'crypto';

export function otpGenerator(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

export function compareHashedOtp(plainOtp: string, hashedOtp: string): boolean {
  const hashedPlainOtp = hashOtp(plainOtp);
  return hashedPlainOtp === hashedOtp;
}

