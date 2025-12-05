import { Module } from '@nestjs/common';
import { OtpCleanupService } from './otp-cleanup.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  providers: [OtpCleanupService],
})
export class OtpCleanupModule {}
