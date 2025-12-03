import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import envConfig from './config/env.config';
import { getDatabaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CompanyModule } from './modules/company/company.module';
import { JobModule } from './modules/job/job.module';
import { ApplicationModule } from './modules/application/application.module';
import { ChatModule } from './modules/chat/chat.module';
import { AdminModule } from './modules/admin/admin.module';
import { AssetsModule } from './modules/assets/assets.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    CompanyModule,
    JobModule,
    ApplicationModule,
    ChatModule,
    AdminModule,
    AssetsModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

