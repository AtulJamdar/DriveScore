import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RewardDocument = Reward & Document;

@Schema({ timestamps: true })
export class Reward {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ default: 0 })
  milesBalance: number;

  @Prop({
    type: [
      {
        type: { type: String, enum: ['earned', 'redeemed'], required: true },
        amount: { type: Number, required: true },
        reason: { type: String, required: true },
        date: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  history: {
    type: 'earned' | 'redeemed';
    amount: number;
    reason: string;
    date: Date;
  }[];
}

export const RewardSchema = SchemaFactory.createForClass(Reward);