import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatRepository } from './chat.repository';
import { ChatGateway } from './chat.gateway';
import { Message, MessageSchema } from './entities/message.entity';
import { Conversation, ConversationSchema } from './schemas/conversation.schema';
import { UserModule } from '../user/user.module';
import { CompanyModule } from '../company/company.module';
import { ApplicationModule } from '../application/application.module';
import { ChatAuthorizationUtil } from './utils/authorization.util';
import { getJwtConfig } from '../../config/jwt.config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Conversation.name, schema: ConversationSchema },
    ]),
    UserModule,
    CompanyModule,
    ApplicationModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: getJwtConfig,
      inject: [ConfigService],
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository, ChatGateway, ChatAuthorizationUtil],
  exports: [ChatService, ChatRepository],
})
export class ChatModule {}
