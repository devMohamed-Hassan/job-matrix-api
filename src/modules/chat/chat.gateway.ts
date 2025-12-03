import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dtos/send-message.dto';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers: Map<string, Set<string>> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractTokenFromSocket(client);
      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: No token provided`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      if (!payload || !payload.sub) {
        this.logger.warn(`Client ${client.id} disconnected: Invalid token`);
        client.disconnect();
        return;
      }

      const userId = payload.sub;
      client.data.userId = userId;
      client.data.role = payload.role;

      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(client.id);

      client.join(`user:${userId}`);

      this.logger.log(`User ${userId} connected to chat (socket: ${client.id})`);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      const userSockets = this.connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(userId);
        }
      }
      this.logger.log(`User ${userId} disconnected from chat (socket: ${client.id})`);
    }
  }

  @SubscribeMessage('join-conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) {
      return { success: false, message: 'Unauthorized' };
    }

    if (!data.conversationId) {
      return { success: false, message: 'Conversation ID is required' };
    }

    try {
      const conversation = await this.chatService.getConversationById(data.conversationId);
      if (!conversation) {
        return { success: false, message: 'Conversation not found' };
      }

      const isParticipant = conversation.participants.some(
        (p) => p.toString() === userId,
      );
      if (!isParticipant) {
        return { success: false, message: 'You are not a participant in this conversation' };
      }

      client.join(`conversation:${data.conversationId}`);

      this.logger.log(`User ${userId} joined conversation ${data.conversationId}`);
      return {
        success: true,
        message: 'Joined conversation',
        conversationId: data.conversationId,
      };
    } catch (error) {
      this.logger.error(`Error joining conversation: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto,
  ) {
    const senderId = client.data.userId;
    if (!senderId) {
      return { success: false, message: 'Unauthorized' };
    }

    try {
      if (!data.message || data.message.trim().length === 0) {
        return { success: false, message: 'Message cannot be empty' };
      }

      if (data.message.length > 2000) {
        return { success: false, message: 'Message must not exceed 2000 characters' };
      }

      const { message, conversation } = await this.chatService.sendMessage(
        senderId,
        data,
      );

      const senderInfo = message.senderId as any;
      const senderName = senderInfo?.firstName && senderInfo?.lastName
        ? `${senderInfo.firstName} ${senderInfo.lastName}`
        : 'Unknown User';
      const senderRole = senderInfo?.role || 'User';
      const senderIdValue = senderInfo?._id || senderInfo || message.senderId;

      const receiverId = data.receiverId;
      const messageData = {
        event: 'receive-message',
        data: {
          messageId: message._id,
          conversationId: conversation._id,
          senderId: {
            _id: senderIdValue,
            name: senderName,
            role: senderRole,
          },
          message: message.message,
          createdAt: message.createdAt,
        },
      };

      this.server.to(`user:${receiverId}`).emit('receive-message', messageData);
      this.server.to(`conversation:${conversation._id}`).emit('receive-message', messageData);

      return {
        success: true,
        messageId: message._id.toString(),
        conversationId: conversation._id.toString(),
        createdAt: message.createdAt,
      };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      return {
        success: false,
        message: error.message || 'Failed to send message',
      };
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    const userId = client.data.userId;
    if (!userId) {
      return { success: false, message: 'Unauthorized' };
    }

    if (!data.conversationId) {
      return { success: false, message: 'Conversation ID is required' };
    }

    try {
      const conversation = await this.chatService.getConversationById(data.conversationId);
      if (!conversation) {
        return { success: false, message: 'Conversation not found' };
      }

      const isParticipant = conversation.participants.some(
        (p) => p.toString() === userId,
      );
      if (!isParticipant) {
        return { success: false, message: 'You are not a participant in this conversation' };
      }

      const otherParticipant = conversation.participants.find(
        (p) => p.toString() !== userId,
      );

      if (otherParticipant) {
        this.server.to(`user:${otherParticipant}`).emit('user-typing', {
          event: 'user-typing',
          data: {
            conversationId: data.conversationId,
            userId: userId,
            isTyping: data.isTyping,
          },
        });
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Error handling typing: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  @SubscribeMessage('message-delivered')
  async handleMessageDelivered(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) {
      return { success: false, message: 'Unauthorized' };
    }

    return { success: true, messageId: data.messageId };
  }

  private extractTokenFromSocket(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    const token = client.handshake.auth?.token;
    if (token) {
      return token;
    }

    const queryToken = client.handshake.query?.token as string;
    return queryToken || null;
  }
}

