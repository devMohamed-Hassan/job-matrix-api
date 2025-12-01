import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { UserRepository } from "../user/user.repository";
import { Provider, OtpType } from "../user/entities/user.entity";
import { SignUpDto } from "./dtos/sign-up.dto";
import { SignInDto } from "./dtos/sign-in.dto";
import { ConfirmOtpDto } from "./dtos/confirm-otp.dto";
import { ForgotPasswordDto } from "./dtos/forgot-password.dto";
import { ResetPasswordDto } from "./dtos/reset-password.dto";
import { GoogleAuthDto } from "./dtos/google-auth.dto";
import { RefreshTokenDto } from "./dtos/refresh-token.dto";
import {
  otpGenerator,
  hashOtp,
  compareHashedOtp,
} from "../../common/utils/otp.util";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../common/utils/jwt.util";
import { EmailService } from "../email/email.service";

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userRepository: UserRepository,
    private emailService: EmailService
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const email = signUpDto.email.toLowerCase();

    const existingUser = await this.userRepository.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException("Email already exists");
    }

    const otp = otpGenerator();
    const hashedOtp = hashOtp(otp);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const user = await this.userRepository.create({
      email,
      password: signUpDto.password,
      firstName: signUpDto.firstName,
      lastName: signUpDto.lastName,
      gender: signUpDto.gender,
      DOB: new Date(signUpDto.DOB),
      mobileNumber: signUpDto.mobileNumber,
      provider: Provider.SYSTEM,
      emailConfirmed: false,
      otp: [
        {
          value: hashedOtp,
          type: OtpType.CONFIRM_EMAIL,
          expiresAt,
        },
      ],
    });

    try {
      await this.emailService.sendOtpEmail({
        to: email,
        otp,
        type: OtpType.CONFIRM_EMAIL,
        userName: `${signUpDto.firstName} ${signUpDto.lastName}`,
      });
    } catch (error) {
      console.error("Failed to send OTP email:", error);
    }

    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.refreshTokenHash;
    delete userObject.otp;

    return {
      message:
        "User registered successfully. Please confirm your email with the OTP sent to your email.",
      user: userObject,
    };
  }

  async confirmOtp(confirmOtpDto: ConfirmOtpDto) {
    const email = confirmOtpDto.email.toLowerCase();
    const user = await this.userRepository.findOneByEmail(email);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.emailConfirmed) {
      throw new BadRequestException("Email already confirmed");
    }

    const confirmEmailOtps = user.otp.filter(
      (otp) => otp.type === OtpType.CONFIRM_EMAIL
    );

    if (confirmEmailOtps.length === 0) {
      throw new BadRequestException("No OTP found. Please request a new one.");
    }

    const latestOtp = confirmEmailOtps.sort(
      (a, b) => b.expiresAt.getTime() - a.expiresAt.getTime()
    )[0];

    if (new Date() > latestOtp.expiresAt) {
      throw new BadRequestException(
        "OTP has expired. Please request a new one."
      );
    }

    if (latestOtp.type !== OtpType.CONFIRM_EMAIL) {
      throw new BadRequestException("Invalid OTP type");
    }

    if (!compareHashedOtp(confirmOtpDto.otp, latestOtp.value)) {
      throw new BadRequestException("Invalid OTP");
    }

    const updatedOtps = user.otp.filter(
      (otp) =>
        !(
          otp.value === latestOtp.value &&
          otp.type === latestOtp.type &&
          otp.expiresAt.getTime() === latestOtp.expiresAt.getTime()
        )
    );
    await this.userRepository.update(user._id.toString(), {
      emailConfirmed: true,
      otp: updatedOtps,
    });

    return {
      message: "Email confirmed successfully",
    };
  }

  async signIn(signInDto: SignInDto) {
    const email = signInDto.email.toLowerCase();

    const user = await this.userRepository.findByEmailWithPassword(email);

    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.deletedAt) {
      throw new UnauthorizedException("Account has been deleted");
    }

    if (user.bannedAt) {
      throw new UnauthorizedException("Account has been banned");
    }

    if (user.provider !== Provider.SYSTEM) {
      throw new UnauthorizedException(
        "Please use the correct sign-in method for your account"
      );
    }

    if (!user.password) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(
      signInDto.password,
      user.password
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = await generateAccessToken(this.jwtService, payload);
    const refreshToken = await generateRefreshToken(
      this.jwtService,
      this.configService,
      payload
    );

    const refreshTokenHash = hashOtp(refreshToken);
    await this.userRepository.update(user._id.toString(), {
      refreshTokenHash,
    });

    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.refreshTokenHash;
    delete userObject.otp;

    return {
      accessToken,
      refreshToken,
      user: userObject,
    };
  }

  async signUpWithGoogle(googleAuthDto: GoogleAuthDto) {
    const email = googleAuthDto.email.toLowerCase();

    let user = await this.userRepository.findOneByEmail(email);

    if (user) {
      const payload = {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
      };

      const accessToken = await generateAccessToken(this.jwtService, payload);
      const refreshToken = await generateRefreshToken(
        this.jwtService,
        this.configService,
        payload
      );

      const refreshTokenHash = hashOtp(refreshToken);
      await this.userRepository.update(user._id.toString(), {
        refreshTokenHash,
      });

      const userObject = user.toObject();
      delete userObject.password;
      delete userObject.refreshTokenHash;
      delete userObject.otp;

      return {
        accessToken,
        refreshToken,
        user: userObject,
      };
    }

    user = await this.userRepository.create({
      email,
      firstName: googleAuthDto.firstName,
      lastName: googleAuthDto.lastName,
      provider: Provider.GOOGLE,
      emailConfirmed: true,
    });

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = await generateAccessToken(this.jwtService, payload);
    const refreshToken = await generateRefreshToken(
      this.jwtService,
      this.configService,
      payload
    );

    const refreshTokenHash = hashOtp(refreshToken);
    await this.userRepository.update(user._id.toString(), {
      refreshTokenHash,
    });

    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.refreshTokenHash;
    delete userObject.otp;

    return {
      accessToken,
      refreshToken,
      user: userObject,
    };
  }

  async loginWithGoogle(googleAuthDto: GoogleAuthDto) {
    const email = googleAuthDto.email.toLowerCase();

    const user = await this.userRepository.findOneByEmail(email);

    if (!user) {
      throw new NotFoundException("User not found. Please sign up first.");
    }

    if (user.deletedAt) {
      throw new UnauthorizedException("Account has been deleted");
    }

    if (user.bannedAt) {
      throw new UnauthorizedException("Account has been banned");
    }

    if (user.provider !== Provider.GOOGLE) {
      throw new UnauthorizedException(
        "Please use the correct sign-in method for your account"
      );
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = await generateAccessToken(this.jwtService, payload);
    const refreshToken = await generateRefreshToken(
      this.jwtService,
      this.configService,
      payload
    );

    const refreshTokenHash = hashOtp(refreshToken);
    await this.userRepository.update(user._id.toString(), {
      refreshTokenHash,
    });

    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.refreshTokenHash;
    delete userObject.otp;

    return {
      accessToken,
      refreshToken,
      user: userObject,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const email = forgotPasswordDto.email.toLowerCase();

    const user = await this.userRepository.findOneByEmail(email);

    if (!user) {
      return {
        message:
          "If the email exists, an OTP has been sent to reset your password.",
      };
    }

    if (user.deletedAt) {
      throw new UnauthorizedException("Account has been deleted");
    }

    if (user.bannedAt) {
      throw new UnauthorizedException("Account has been banned");
    }

    if (user.provider !== Provider.SYSTEM) {
      throw new BadRequestException(
        "Password reset is only available for system accounts"
      );
    }

    const otp = otpGenerator();
    const hashedOtp = hashOtp(otp);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const filteredOtps = user.otp.filter(
      (otp) => otp.type !== OtpType.RESET_PASSWORD
    );
    filteredOtps.push({
      value: hashedOtp,
      type: OtpType.RESET_PASSWORD,
      expiresAt,
    });

    await this.userRepository.update(user._id.toString(), {
      otp: filteredOtps,
    });

    try {
      await this.emailService.sendOtpEmail({
        to: email,
        otp,
        type: OtpType.RESET_PASSWORD,
        userName: `${user.firstName} ${user.lastName}`,
      });
    } catch (error) {
      console.error("Failed to send OTP email:", error);
    }

    return {
      message:
        "If the email exists, an OTP has been sent to reset your password.",
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const email = resetPasswordDto.email.toLowerCase();

    const user = await this.userRepository.findByEmailWithPassword(email);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.deletedAt) {
      throw new UnauthorizedException("Account has been deleted");
    }

    if (user.bannedAt) {
      throw new UnauthorizedException("Account has been banned");
    }

    if (user.provider !== Provider.SYSTEM) {
      throw new BadRequestException(
        "Password reset is only available for system accounts"
      );
    }

    const resetPasswordOtps = user.otp.filter(
      (otp) => otp.type === OtpType.RESET_PASSWORD
    );

    if (resetPasswordOtps.length === 0) {
      throw new BadRequestException("No OTP found. Please request a new one.");
    }

    const latestOtp = resetPasswordOtps.sort(
      (a, b) => b.expiresAt.getTime() - a.expiresAt.getTime()
    )[0];

    if (new Date() > latestOtp.expiresAt) {
      throw new BadRequestException(
        "OTP has expired. Please request a new one."
      );
    }

    if (latestOtp.type !== OtpType.RESET_PASSWORD) {
      throw new BadRequestException("Invalid OTP type");
    }

    if (!compareHashedOtp(resetPasswordDto.otp, latestOtp.value)) {
      throw new BadRequestException("Invalid OTP");
    }

    const saltRounds = Number(process.env.SALT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(
      resetPasswordDto.newPassword,
      saltRounds
    );

    const updatedOtps = user.otp.filter(
      (otp) =>
        !(
          otp.value === latestOtp.value &&
          otp.type === latestOtp.type &&
          otp.expiresAt.getTime() === latestOtp.expiresAt.getTime()
        )
    );

    await this.userRepository.update(user._id.toString(), {
      password: hashedPassword,
      otp: updatedOtps,
      refreshTokenHash: null,
      changeCredentialTime: new Date(),
    });

    return {
      message:
        "Password reset successfully. Please login with your new password.",
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const payload = await verifyRefreshToken(
        this.jwtService,
        this.configService,
        refreshTokenDto.refreshToken
      );

      const user = await this.userRepository.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException("User not found");
      }

      if (user.deletedAt) {
        throw new UnauthorizedException("Account has been deleted");
      }

      if (user.bannedAt) {
        throw new UnauthorizedException("Account has been banned");
      }

      const userWithToken = await this.userRepository.findByIdWithRefreshToken(
        payload.sub
      );
      if (!userWithToken || !userWithToken.refreshTokenHash) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      const storedTokenHash = userWithToken.refreshTokenHash;
      const providedTokenHash = hashOtp(refreshTokenDto.refreshToken);

      if (storedTokenHash !== providedTokenHash) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      const decodedToken = this.jwtService.decode(
        refreshTokenDto.refreshToken
      ) as any;
      if (decodedToken && decodedToken.iat) {
        const tokenIssuedAt = new Date(decodedToken.iat * 1000);
        if (tokenIssuedAt < user.changeCredentialTime) {
          throw new UnauthorizedException("Refresh token has been invalidated");
        }
      }

      const newPayload = {
        sub: user._id.toString(),
        email: user.email,
        role: user.role,
      };

      const accessToken = await generateAccessToken(
        this.jwtService,
        newPayload
      );

      return {
        accessToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Invalid refresh token");
    }
  }
}
