import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true })
export class Company {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  description?: string;

  @Prop()
  website?: string;

  @Prop()
  logo?: string;

  @Prop()
  industry?: string;

  @Prop()
  location?: string;

  @Prop()
  size?: string;

  @Prop({ type: String, ref: 'User' })
  ownerId: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const CompanySchema = SchemaFactory.createForClass(Company);

