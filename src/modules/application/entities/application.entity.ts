import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ApplicationDocument = Application & Document;

export enum ApplicationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  VIEWED = 'viewed',
  IN_CONSIDERATION = 'in-consideration',
  REJECTED = 'rejected',
}

export interface UserCV {
  secure_url: string;
  public_id: string;
}

@Schema({ timestamps: true })
export class Application {
  @Prop({ type: Types.ObjectId, ref: 'Job', required: true, index: true })
  jobId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({
    type: {
      secure_url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
    required: true,
  })
  userCV: UserCV;

  @Prop({
    type: String,
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING,
    index: true,
  })
  status: ApplicationStatus;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);

ApplicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

ApplicationSchema.index({ jobId: 1, status: 1 });
