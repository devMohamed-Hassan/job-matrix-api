import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './entities/message.entity';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';

@Injectable()
export class ChatRepository {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
  ) {}

  async createMessage(messageData: Partial<Message>): Promise<MessageDocument> {
    const message = new this.messageModel(messageData);
    return message.save();
  }

  async findMessageById(id: string): Promise<MessageDocument | null> {
    return this.messageModel
      .findById(id)
      .populate('senderId', 'firstName lastName email role')
      .populate('receiverId', 'firstName lastName email role')
      .exec();
  }

  async findMessagesByConversation(
    conversationId: string,
    skip: number = 0,
    limit: number = 50,
    sort: string = 'createdAt',
  ): Promise<{ messages: MessageDocument[]; total: number }> {
    const sortOrder = sort.startsWith('-') ? -1 : 1;
    const sortField = sort.replace(/^-/, '');

    const [messages, total] = await Promise.all([
      this.messageModel
        .find({ conversationId: new Types.ObjectId(conversationId) })
        .populate('senderId', 'firstName lastName email role')
        .populate('receiverId', 'firstName lastName email role')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.messageModel.countDocuments({ conversationId: new Types.ObjectId(conversationId) }).exec(),
    ]);

    return { messages, total };
  }

  async findMessagesBetweenUsers(
    userId1: string,
    userId2: string,
    skip: number = 0,
    limit: number = 50,
    sort: string = 'createdAt',
  ): Promise<{ messages: MessageDocument[]; total: number }> {
    const sortOrder = sort.startsWith('-') ? -1 : 1;
    const sortField = sort.replace(/^-/, '');

    const [messages, total] = await Promise.all([
      this.messageModel
        .find({
          $or: [
            { senderId: new Types.ObjectId(userId1), receiverId: new Types.ObjectId(userId2) },
            { senderId: new Types.ObjectId(userId2), receiverId: new Types.ObjectId(userId1) },
          ],
        })
        .populate('senderId', 'firstName lastName email role')
        .populate('receiverId', 'firstName lastName email role')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.messageModel
        .countDocuments({
          $or: [
            { senderId: new Types.ObjectId(userId1), receiverId: new Types.ObjectId(userId2) },
            { senderId: new Types.ObjectId(userId2), receiverId: new Types.ObjectId(userId1) },
          ],
        })
        .exec(),
    ]);

    return { messages, total };
  }

  async markMessagesAsRead(conversationId: string, receiverId: string): Promise<void> {
    await this.messageModel
      .updateMany(
        {
          conversationId: new Types.ObjectId(conversationId),
          receiverId: new Types.ObjectId(receiverId),
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        },
      )
      .exec();
  }

  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    return this.messageModel
      .countDocuments({
        conversationId: new Types.ObjectId(conversationId),
        receiverId: new Types.ObjectId(userId),
        isRead: false,
      })
      .exec();
  }
  
  async createConversation(conversationData: Partial<Conversation>): Promise<ConversationDocument> {
    const conversation = new this.conversationModel(conversationData);
    return conversation.save();
  }

  async findConversationById(id: string): Promise<ConversationDocument | null> {
    return this.conversationModel
      .findById(id)
      .populate('participants', 'firstName lastName email role')
      .populate('initiatedBy', 'firstName lastName email role')
      .populate('companyId', 'companyName')
      .exec();
  }

  async findConversationByParticipants(
    userId1: string,
    userId2: string,
  ): Promise<ConversationDocument | null> {
    return this.conversationModel
      .findOne({
        participants: {
          $all: [
            new Types.ObjectId(userId1),
            new Types.ObjectId(userId2),
          ],
        },
        isActive: true,
      })
      .populate('participants', 'firstName lastName email role')
      .populate('initiatedBy', 'firstName lastName email role')
      .populate('companyId', 'companyName')
      .exec();
  }

  async findUserConversations(
    userId: string,
    skip: number = 0,
    limit: number = 20,
    sort: string = '-lastMessageAt',
  ): Promise<{ conversations: ConversationDocument[]; total: number }> {
    const sortOrder = sort.startsWith('-') ? -1 : 1;
    const sortField = sort.replace(/^-/, '');

    const [conversations, total] = await Promise.all([
      this.conversationModel
        .find({
          participants: new Types.ObjectId(userId),
          isActive: true,
        })
        .populate('participants', 'firstName lastName email role')
        .populate('initiatedBy', 'firstName lastName email role')
        .populate('companyId', 'companyName')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.conversationModel
        .countDocuments({
          participants: new Types.ObjectId(userId),
          isActive: true,
        })
        .exec(),
    ]);

    return { conversations, total };
  }

  async updateConversationLastMessage(
    conversationId: string,
    message: string,
  ): Promise<void> {
    await this.conversationModel
      .findByIdAndUpdate(conversationId, {
        $set: {
          lastMessage: message.substring(0, 200),
          lastMessageAt: new Date(),
        },
      })
      .exec();
  }

  async incrementUnreadCount(conversationId: string, receiverId: string): Promise<void> {
    await this.conversationModel
      .findByIdAndUpdate(conversationId, {
        $inc: { [`unreadCount.${receiverId}`]: 1 },
      })
      .exec();
  }

  async resetUnreadCount(conversationId: string, userId: string): Promise<void> {
    await this.conversationModel
      .findByIdAndUpdate(conversationId, {
        $set: { [`unreadCount.${userId}`]: 0 },
      })
      .exec();
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await this.conversationModel
      .findByIdAndUpdate(conversationId, {
        $set: { isActive: false },
      })
      .exec();
  }

  async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const conversation = await this.conversationModel
      .findOne({
        _id: new Types.ObjectId(conversationId),
        participants: new Types.ObjectId(userId),
      })
      .exec();
    return !!conversation;
  }
}
