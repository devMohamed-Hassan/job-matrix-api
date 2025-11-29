import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dtos/create-message.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  create(@Body() createMessageDto: CreateMessageDto) {
    // TODO: Extract senderId from authenticated user
    return this.chatService.create(createMessageDto, '');
  }

  @Get('conversation/:userId')
  getConversation(@Param('userId') userId: string) {
    // TODO: Extract current userId from authenticated user
    return this.chatService.getConversation('', userId);
  }
}

