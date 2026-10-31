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

  @Prop({ default: 'active' })
  status: string;

  @Prop({ 
    type: Object, 
    default: { harshBraking: 0, harshAccel: 0, harshTurn: 0, totalEvents: 0 } 
  })
  stats: {
    harshBraking: number;
    harshAccel: number;
    harshTurn: number;
    totalEvents: number;
  };

  @Prop({ default: 0 })
  totalKm: number;

  @Prop({ default: 0 })
  milesEarned: number;

  @Prop({ default: 100 })
  score: number; // live score during trip

  @Prop({ default: 100 })
  finalScore: number; // final score after endTrip - YE MISSING THA

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

  @Prop({
    type: [
      {
        type: {
          type: String,
          enum: ['harsh_braking', 'harsh_accel', 'harsh_turn'],
          required: true,
        },
        at: { type: Number, required: true },
      },
    ],
    default: [],
  })
  events: {
    type: 'harsh_braking' | 'harsh_accel' | 'harsh_turn';
    at: number;
  }[];
}

export const TripSchema = SchemaFactory.createForClass(Trip);