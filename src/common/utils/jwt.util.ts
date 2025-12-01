import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface TokenPayload {
  sub: string;
  email: string;
  role?: string;
}

export async function generateAccessToken(
  jwtService: JwtService,
  payload: TokenPayload,
): Promise<string> {
  return jwtService.signAsync(payload, {
    expiresIn: '1h',
  });
}

export async function generateRefreshToken(
  jwtService: JwtService,
  configService: ConfigService,
  payload: TokenPayload,
): Promise<string> {
  const refreshSecret = configService.get<string>('jwt.refreshSecret');
  return jwtService.signAsync(payload, {
    secret: refreshSecret,
    expiresIn: '7d',
  });
}

export async function verifyRefreshToken(
  jwtService: JwtService,
  configService: ConfigService,
  token: string,
): Promise<TokenPayload> {
  const refreshSecret = configService.get<string>('jwt.refreshSecret');
  return jwtService.verifyAsync<TokenPayload>(token, {
    secret: refreshSecret,
  });
}

