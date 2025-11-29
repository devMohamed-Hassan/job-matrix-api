import { ConfigService } from "@nestjs/config";
import { JwtModuleOptions } from "@nestjs/jwt";

export const getJwtConfig = (
  configService: ConfigService
): JwtModuleOptions => {
  return {
    secret: configService.get<string>("jwt.secret"),
    signOptions: {
      expiresIn: "15m",
    },
  };
};

export const getJwtRefreshConfig = (
  configService: ConfigService
): JwtModuleOptions => {
  return {
    secret: configService.get<string>("jwt.refreshSecret"),
    signOptions: {
      expiresIn: "7d",
    },
  };
};
