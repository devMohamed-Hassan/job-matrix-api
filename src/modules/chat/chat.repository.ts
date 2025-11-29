import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './entities/message.entity';

@Injectable()
export class ChatRepository {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async create(messageData: Partial<Message>): Promise<MessageDocument> {
    const message = new this.messageModel(messageData);
    return message.save();
  }

  async findById(id: string): Promise<MessageDocument | null> {
    return this.messageModel
      .findById(id)
      .populate('senderId')
      .populate('receiverId')
      .exec();
  }

  async findConversation(
    userId1: string,
    userId2: string,
  ): Promise<MessageDocument[]> {
    return this.messageModel
      .find({
        $or: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      })
      .populate('senderId')
      .populate('receiverId')
      .sort({ createdAt: 1 })
      .exec();
  }

  async markAsRead(messageId: string): Promise<void> {
    await this.messageModel.findByIdAndUpdate(messageId, { isRead: true }).exec();
  }
}

