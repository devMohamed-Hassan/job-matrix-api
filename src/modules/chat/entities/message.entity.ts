import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: String, ref: 'User', required: true })
  senderId: string;

  @Prop({ type: String, ref: 'User', required: true })
  receiverId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: String, ref: 'Application' })
  applicationId?: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

