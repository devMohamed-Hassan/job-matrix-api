import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { PaginationDto } from './dtos/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '../../common/decorators/current-user.decorator';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  @Get('history/:userId')
  async getChatHistory(
    @Param('userId') targetUserId: string,
    @Query() pagination: PaginationDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.chatService.getChatHistory(
      user.userId,
      targetUserId,
      pagination,
    );
  }

  @Get('conversations')
  async getConversations(
    @Query() pagination: PaginationDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.chatService.getConversations(user.userId, pagination);
  }

  @Patch('conversations/:conversationId/read')
  async markMessagesAsRead(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.chatService.markMessagesAsRead(conversationId, user.userId);
  }
  
  @Delete('conversations/:conversationId')
  async deleteConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.chatService.deleteConversation(conversationId, user.userId);
  }
}
