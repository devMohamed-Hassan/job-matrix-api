import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dtos/sign-up.dto';
import { SignInDto } from './dtos/sign-in.dto';
import { ConfirmOtpDto } from './dtos/confirm-otp.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { GoogleAuthDto } from './dtos/google-auth.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { RefreshToken } from '../../common/decorators/refresh-token.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signUpDto: SignUpDto) {
    return await this.authService.signUp(signUpDto);
  }

  @Post('confirm-otp')
  @HttpCode(HttpStatus.OK)
  async confirmOtp(@Body() confirmOtpDto: ConfirmOtpDto) {
    return await this.authService.confirmOtp(confirmOtpDto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signin(@Body() signInDto: SignInDto) {
    return await this.authService.signIn(signInDto);
  }

  @Post('google/signup')
  @HttpCode(HttpStatus.OK)
  async signUpWithGoogle(@Body() googleAuthDto: GoogleAuthDto) {
    return await this.authService.signUpWithGoogle(googleAuthDto);
  }

  @Post('google/login')
  @HttpCode(HttpStatus.OK)
  async loginWithGoogle(@Body() googleAuthDto: GoogleAuthDto) {
    return await this.authService.loginWithGoogle(googleAuthDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@RefreshToken() token: string) {
    return await this.authService.refreshToken({ refreshToken: token });
  }
}
