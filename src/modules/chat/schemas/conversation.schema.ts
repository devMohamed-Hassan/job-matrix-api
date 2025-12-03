import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ 
    type: [{ type: Types.ObjectId, ref: 'User' }], 
    required: true,
    validate: {
      validator: (participants: Types.ObjectId[]) => participants.length === 2,
      message: 'Conversation must have exactly 2 participants'
    }
  })
  participants: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  companyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Application', default: null })
  applicationId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  initiatedBy: Types.ObjectId;

  @Prop({ type: String, maxlength: 200, default: '' })
  lastMessage: string;

  @Prop({ type: Date, default: Date.now, index: true })
  lastMessageAt: Date;

  @Prop({
    type: Map,
    of: Number,
    default: {}
  })
  unreadCount: Map<string, number>;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.index({ participants: 1, isActive: 1 });
ConversationSchema.index({ companyId: 1, isActive: 1 });
ConversationSchema.index({ lastMessageAt: -1 });

