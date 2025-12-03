import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ChatRepository } from './chat.repository';
import { SendMessageDto } from './dtos/send-message.dto';
import { PaginationDto } from './dtos/pagination.dto';
import { MessageDocument } from './entities/message.entity';
import { ConversationDocument } from './schemas/conversation.schema';
import { ChatAuthorizationUtil } from './utils/authorization.util';
import { UserRepository } from '../user/user.repository';
import { CompanyRepository } from '../company/company.repository';
import { ApplicationRepository } from '../application/application.repository';
import { Types } from 'mongoose';
import { calculatePagination } from '../../common/utils/pagination.util';

@Injectable()
export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly authorizationUtil: ChatAuthorizationUtil,
    private readonly userRepository: UserRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly applicationRepository: ApplicationRepository,
  ) {}

  async getChatHistory(
    authUserId: string,
    targetUserId: string,
    pagination: PaginationDto,
  ) {
    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new BadRequestException('Invalid target user ID');
    }

    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    if (authUserId === targetUserId) {
    } else {
      const authUser = await this.userRepository.findById(authUserId);
      if (!authUser) {
        throw new NotFoundException('Authenticated user not found');
      }

      const authUserCompanyId = await this.authorizationUtil.getUserCompanyId(authUserId);
      if (authUserCompanyId) {
      } else {
        throw new ForbiddenException('You are not authorized to view this conversation');
      }
    }

    let conversation = await this.chatRepository.findConversationByParticipants(
      authUserId,
      targetUserId,
    );

    if (!conversation) {
      return {
        conversation: null,
        messages: [],
        pagination: {
          total: 0,
          page: pagination.page || 1,
          limit: pagination.limit || 50,
          totalPages: 0,
        },
      };
    }

    const skip = ((pagination.page || 1) - 1) * (pagination.limit || 50);
    const { messages, total } = await this.chatRepository.findMessagesByConversation(
      conversation._id.toString(),
      skip,
      pagination.limit || 50,
      pagination.sort || 'createdAt',
    );

    await this.chatRepository.markMessagesAsRead(
      conversation._id.toString(),
      authUserId,
    );
    await this.chatRepository.resetUnreadCount(conversation._id.toString(), authUserId);

    const paginationMeta = calculatePagination(total, skip, pagination.limit || 50);

    return {
      conversation: {
        _id: conversation._id,
        participants: conversation.participants,
        lastMessageAt: conversation.lastMessageAt,
        companyId: conversation.companyId,
      },
      messages,
      pagination: paginationMeta,
    };
  }

  async getConversations(authUserId: string, pagination: PaginationDto) {
    const skip = ((pagination.page || 1) - 1) * (pagination.limit || 20);
    const { conversations, total } = await this.chatRepository.findUserConversations(
      authUserId,
      skip,
      pagination.limit || 20,
      pagination.sort || '-lastMessageAt',
    );

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await this.chatRepository.getUnreadCount(
          conv._id.toString(),
          authUserId,
        );
        return {
          ...conv.toObject(),
          unreadCount,
        };
      }),
    );

    const paginationMeta = calculatePagination(total, skip, pagination.limit || 20);

    return {
      data: conversationsWithUnread,
      pagination: paginationMeta,
    };
  }

  async markMessagesAsRead(conversationId: string, userId: string) {
    const isParticipant = await this.chatRepository.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    await this.chatRepository.markMessagesAsRead(conversationId, userId);
    await this.chatRepository.resetUnreadCount(conversationId, userId);

    return {
      success: true,
      message: 'Messages marked as read',
    };
  }

  async deleteConversation(conversationId: string, userId: string) {
    const isParticipant = await this.chatRepository.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    await this.chatRepository.deleteConversation(conversationId);

    return {
      success: true,
      message: 'Conversation deleted successfully',
    };
  }

  async sendMessage(
    senderId: string,
    sendMessageDto: SendMessageDto,
  ): Promise<{ message: MessageDocument; conversation: ConversationDocument }> {
    const receiver = await this.userRepository.findById(sendMessageDto.receiverId);
    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    let conversation: ConversationDocument | null = null;

    if (sendMessageDto.conversationId) {
      conversation = await this.chatRepository.findConversationById(
        sendMessageDto.conversationId,
      );
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      const isParticipant = conversation.participants.some(
        (p) => p.toString() === senderId,
      );
      if (!isParticipant) {
        throw new ForbiddenException('You are not a participant in this conversation');
      }
    } else {
      const sender = await this.userRepository.findById(senderId);
      if (!sender) {
        throw new NotFoundException('Sender not found');
      }

      let companyId: string | null = null;

      if (sendMessageDto.applicationId) {
        const application = await this.applicationRepository.findById(
          sendMessageDto.applicationId,
        );
        if (!application) {
          throw new NotFoundException('Application not found');
        }

        const job = application.jobId as any;
        if (job && job.companyId) {
          const jobCompanyId = job.companyId;
          companyId =
            jobCompanyId && typeof jobCompanyId === 'object' && '_id' in jobCompanyId
              ? jobCompanyId._id.toString()
              : jobCompanyId?.toString() || null;
        }
      }

      if (!companyId) {
        companyId = await this.authorizationUtil.getUserCompanyId(senderId);
      }

      if (!companyId) {
        throw new ForbiddenException(
          'Only HR or Company Owner can initiate conversations with users',
        );
      }

      const isHrOrOwner = await this.authorizationUtil.isHrOrOwner(senderId, companyId);
      if (!isHrOrOwner) {
        throw new ForbiddenException(
          'Only HR or Company Owner can initiate conversations with users',
        );
      }

      const company = await this.companyRepository.findByIdExcludingDeleted(companyId);
      if (!company) {
        throw new NotFoundException('Company not found');
      }

      conversation = await this.chatRepository.findConversationByParticipants(
        senderId,
        sendMessageDto.receiverId,
      );

      if (!conversation) {
        conversation = await this.chatRepository.createConversation({
          participants: [
            new Types.ObjectId(senderId),
            new Types.ObjectId(sendMessageDto.receiverId),
          ],
          companyId: new Types.ObjectId(companyId),
          applicationId: sendMessageDto.applicationId
            ? new Types.ObjectId(sendMessageDto.applicationId)
            : null,
          initiatedBy: new Types.ObjectId(senderId),
          lastMessage: sendMessageDto.message.substring(0, 200),
          lastMessageAt: new Date(),
          unreadCount: new Map(),
          isActive: true,
        });
      }
    }

    const message = await this.chatRepository.createMessage({
      conversationId: conversation._id,
      senderId: new Types.ObjectId(senderId),
      receiverId: new Types.ObjectId(sendMessageDto.receiverId),
      message: sendMessageDto.message,
      isRead: false,
      readAt: null,
    });

    await this.chatRepository.updateConversationLastMessage(
      conversation._id.toString(),
      sendMessageDto.message,
    );
    await this.chatRepository.incrementUnreadCount(
      conversation._id.toString(),
      sendMessageDto.receiverId,
    );

    const populatedMessage = await this.chatRepository.findMessageById(
      message._id.toString(),
    );

    return {
      message: populatedMessage!,
      conversation,
    };
  }

  async getConversationById(conversationId: string): Promise<ConversationDocument | null> {
    return this.chatRepository.findConversationById(conversationId);
  }
}
