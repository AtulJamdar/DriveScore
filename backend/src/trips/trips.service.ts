import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Trip, TripDocument } from './schemas/trip.schema';

@Injectable()
export class TripsService {
  constructor(@InjectModel(Trip.name) private tripModel: Model<TripDocument>) {}

  async startTrip(userId: string) {
    const trip = await this.tripModel.create({
      userId: userId || 'user_123',
      startTime: new Date(),
      points: [],
      score: 100,
      events: [],
      milesEarned: 0,
    });
    return trip;
  }

  async addPoint(tripId: string, point: { lat: number; lng: number; speed: number; timestamp: number; bearing: number }) {
    const trip = await this.tripModel.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');

    trip.points.push(point);

    // Basic Harsh Driving & Speed Check logic
    if (point.speed > 60) {
      trip.score = Math.max(0, trip.score - 2);
    }

    // Example event detection (e.g., speed > 70 as harsh acceleration or speed drop)
    if (point.speed > 75) {
      trip.events.push({
        type: 'harsh_accel',
        at: point.timestamp,
      });
      trip.score = Math.max(0, trip.score - 5);
    }

    await trip.save();
    return { success: true, currentScore: trip.score };
  }

  async endTrip(tripId: string) {
    const trip = await this.tripModel.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');

    trip.endTime = new Date();
    trip.milesEarned = Math.floor(trip.points.length / 5); // 5 points = 1 mile earned
    await trip.save();

    return trip;
  }
}