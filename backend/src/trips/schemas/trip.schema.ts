import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TripDocument = Trip & Document;

@Schema({ timestamps: true })
export class Trip {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ default: null })
  endTime: Date;

  @Prop({
    type: [
      {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        speed: { type: Number, required: true },
        timestamp: { type: Number, required: true },
        bearing: { type: Number, required: true },
      },
    ],
    default: [],
  })
  points: {
    lat: number;
    lng: number;
    speed: number;
    timestamp: number;
    bearing: number;
  }[];

  @Prop({ default: 0 })
  score: number; // 0 - 100

  @Prop({
    type: [
      {
        type: {
          type: String,
          enum: ['harsh_braking', 'harsh_accel', 'harsh_turn'],
          required: true,
        },
        at: { type: Number, required: true }, // timestamp
      },
    ],
    default: [],
  })
  events: {
    type: 'harsh_braking' | 'harsh_accel' | 'harsh_turn';
    at: number;
  }[];

  @Prop({ default: 0 })
  milesEarned: number;
}

export const TripSchema = SchemaFactory.createForClass(Trip);