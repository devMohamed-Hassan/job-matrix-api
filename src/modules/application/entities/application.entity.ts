import { Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ApplicationDocument = Application & Document;

@Schema({ timestamps: true })
export class Application {}

export const ApplicationSchema = SchemaFactory.createForClass(Application);
