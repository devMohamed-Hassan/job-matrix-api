import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { ThrottlerModule } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_GUARD } from "@nestjs/core";
import { join } from "path";
import envConfig from "./config/env.config";
import { getDatabaseConfig } from "./config/database.config";
import { AuthModule } from "./modules/auth/auth.module";
import { UserModule } from "./modules/user/user.module";
import { CompanyModule } from "./modules/company/company.module";
import { JobModule } from "./modules/job/job.module";
import { ApplicationModule } from "./modules/application/application.module";
import { ChatModule } from "./modules/chat/chat.module";
import { AdminModule } from "./modules/admin/admin.module";
import { AssetsModule } from "./modules/assets/assets.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { OtpCleanupModule } from "./modules/otp-cleanup/otp-cleanup.module";
import { GqlThrottlerGuard } from "./common/guards/gql-throttler.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      envFilePath: ".env",
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: 60000,
          limit: 100,
        },
      ],
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "src/schema.gql"),
      sortSchema: true,
      context: ({ req, res }) => ({ req, res }),
      playground: true,
      introspection: true,
      path: "/graphql",
      debug: true,
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
    OtpCleanupModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
  ],
})
export class AppModule {}
