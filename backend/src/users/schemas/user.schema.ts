import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  firebaseUid: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  displayName?: string;

  @Prop({ default: 0 })
  totalMiles: number;

  @Prop({ default: 100 })
  avgScore: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
