import { Injectable } from '@nestjs/common';
import { ChatRepository } from './chat.repository';
import { CreateMessageDto } from './dtos/create-message.dto';
import { MessageDocument } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(private readonly chatRepository: ChatRepository) {}

  async create(
    createMessageDto: CreateMessageDto,
    senderId: string,
  ): Promise<MessageDocument> {
    // TODO: Implement message creation logic
    throw new Error('Method not implemented.');
  }

  async getConversation(
    userId1: string,
    userId2: string,
  ): Promise<MessageDocument[]> {
    return this.chatRepository.findConversation(userId1, userId2);
  }

  async markAsRead(messageId: string): Promise<void> {
    await this.chatRepository.markAsRead(messageId);
  }
}

