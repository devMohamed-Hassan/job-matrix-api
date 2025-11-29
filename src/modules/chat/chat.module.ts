import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatRepository } from './chat.repository';
import { Message, MessageSchema } from './entities/message.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    UserModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
  exports: [ChatService, ChatRepository],
})
export class ChatModule {}

