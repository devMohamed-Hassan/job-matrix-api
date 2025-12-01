import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

export function encryptMobileNumber(
  mobileNumber: string,
  configService: ConfigService,
): string {
  const key = configService.get<string>('cryptoKey') || 'default_32_character_crypto_key_1234';
  const keyBuffer = crypto.scryptSync(key, 'salt', 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
  let encrypted = cipher.update(mobileNumber, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptMobileNumber(
  encryptedMobileNumber: string,
  configService: ConfigService,
): string {
  const key = configService.get<string>('cryptoKey') || 'default_32_character_crypto_key_1234';
  const keyBuffer = crypto.scryptSync(key, 'salt', 32);
  
  const parts = encryptedMobileNumber.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

