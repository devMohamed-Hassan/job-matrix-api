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

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers: Map<string, Set<string>> = new Map();
  private companyRooms: Map<string, Set<string>> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

      this.logger.log(`Client ${client.id} connected for user ${userId}`);
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

      this.companyRooms.forEach((sockets, companyId) => {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.companyRooms.delete(companyId);
        }
      });

      this.logger.log(`Client ${client.id} disconnected for user ${userId}`);
    }
  }

  @SubscribeMessage('join-company-room')
  handleJoinCompanyRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { companyId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    const companyId = data.companyId;
    if (!companyId) {
      return { error: 'Company ID is required' };
    }

    client.join(`company:${companyId}`);

    if (!this.companyRooms.has(companyId)) {
      this.companyRooms.set(companyId, new Set());
    }
    this.companyRooms.get(companyId)!.add(client.id);

    this.logger.log(`User ${userId} joined company room ${companyId}`);
    return { success: true, companyId };
  }

  @SubscribeMessage('leave-company-room')
  handleLeaveCompanyRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { companyId: string },
  ) {
    const companyId = data.companyId;
    if (companyId) {
      client.leave(`company:${companyId}`);
      
      const companySockets = this.companyRooms.get(companyId);
      if (companySockets) {
        companySockets.delete(client.id);
        if (companySockets.size === 0) {
          this.companyRooms.delete(companyId);
        }
      }
    }
    return { success: true };
  }

  emitNewApplication(companyId: string, applicationData: any) {
    this.server.to(`company:${companyId}`).emit('new-application', {
      type: 'new-application',
      data: applicationData,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Emitted new-application event to company ${companyId}`);
  }

  private extractTokenFromSocket(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    const token = client.handshake.query?.token as string;
    return token || null;
  }
}

