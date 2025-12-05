import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UserRepository } from '../user/user.repository';

@Injectable()
export class OtpCleanupService {
  private readonly logger = new Logger(OtpCleanupService.name);

  constructor(private readonly userRepository: UserRepository) {}

  @Cron('0 */6 * * *')
  async handleExpiredOtpCleanup() {
    this.logger.log('Starting expired OTP cleanup job...');
    
    try {
      const deletedCount = await this.userRepository.deleteExpiredOtps();
      this.logger.log(`Successfully deleted expired OTPs from ${deletedCount} user(s)`);
    } catch (error) {
      this.logger.error(`Error during expired OTP cleanup: ${error.message}`, error.stack);
    }
  }
}
