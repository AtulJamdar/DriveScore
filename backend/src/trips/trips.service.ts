import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Trip, TripDocument } from './schemas/trip.schema';
import { RewardsService } from '../rewards/rewards.service';

@Injectable()
export class TripsService {
  constructor(
    @InjectModel(Trip.name) private tripModel: Model<TripDocument>,
    private rewardsService: RewardsService,
  ) {}

  async startTrip(userId: string) {
    const trip = await this.tripModel.create({
      userId: userId || 'user_123',
      startTime: new Date(),
      points: [],
      score: 100,
      events: [],
      milesEarned: 0,
      stats: { harshBraking: 0, harshAccel: 0, harshTurn: 0, totalEvents: 0 },
    });
    return trip;
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  async addPoint(tripId: string, point: { lat: number; lng: number; speed: number; timestamp: number; bearing: number }) {
    const trip = await this.tripModel.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');

    const prevPoint = trip.points[trip.points.length - 1];
    trip.points.push(point);

    if (prevPoint) {
      const timeDiffSec = (point.timestamp - prevPoint.timestamp) / 1000;
      if (timeDiffSec > 0.5) {
        const v1_ms = (prevPoint.speed * 1000) / 3600;
        const v2_ms = (point.speed * 1000) / 3600;
        const accel = (v2_ms - v1_ms) / timeDiffSec;

        let wouldBeType: string | null = null;
        if (accel < -3.5) wouldBeType = 'harsh_braking';
        else if (accel > 3.0) wouldBeType = 'harsh_accel';
        else {
          const bearingDiff = Math.abs(point.bearing - prevPoint.bearing);
          const normalizedDiff = bearingDiff > 180 ? 360 - bearingDiff : bearingDiff;
          if (normalizedDiff > 60 && point.speed > 25) wouldBeType = 'harsh_turn';
        }

        if (wouldBeType) {
          const lastEv = trip.events[trip.events.length - 1];
          if (lastEv && lastEv.type === wouldBeType) {
            const timeSinceLastEvent = point.timestamp - lastEv.at;
            if (timeSinceLastEvent < 5000) {
              await trip.save();
              return { success: true, currentScore: trip.score };
            }
          }
          if (wouldBeType === 'harsh_braking') {
            trip.events.push({ type: 'harsh_braking', at: point.timestamp } as any);
            trip.score = Math.max(0, trip.score - 10);
          } else if (wouldBeType === 'harsh_accel') {
            trip.events.push({ type: 'harsh_accel', at: point.timestamp } as any);
            trip.score = Math.max(0, trip.score - 8);
          } else if (wouldBeType === 'harsh_turn') {
            trip.events.push({ type: 'harsh_turn', at: point.timestamp } as any);
            trip.score = Math.max(0, trip.score - 12);
          }
        }
      }
    }

    await trip.save();
    return { success: true, currentScore: trip.score, lastEvent: trip.events[trip.events.length - 1] };
  }

  // <-- YAHAN ADD KARNA THA -->
  async addEvent(tripId: string, eventDto: any) {
    const trip = await this.tripModel.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');
    trip.events.push(eventDto);
    await trip.save();
    return trip;
  }

  async endTrip(tripId: string) {
    const trip = await this.tripModel.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');

    let totalKm = 0;
    let validSegments = 0;
    
    if (trip.points && trip.points.length > 1) {
      for (let i = 1; i < trip.points.length; i++) {
        const p1 = trip.points[i-1];
        const p2 = trip.points[i];
        const lat1 = (p1 as any).lat ?? (p1 as any).latitude ?? (p1 as any)[1];
        const lng1 = (p1 as any).lng ?? (p1 as any).longitude ?? (p1 as any)[0];
        const lat2 = (p2 as any).lat ?? (p2 as any).latitude ?? (p2 as any)[1];
        const lng2 = (p2 as any).lng ?? (p2 as any).longitude ?? (p2 as any)[0];
        if (!lat1 || !lng1 || !lat2 || !lng2) continue;
        const d = this.haversine(lat1, lng1, lat2, lng2);
        if (d < 1 && d > 0.005) {
          totalKm += d;
          validSegments++;
        }
      }
    }

    const allEvents = trip.events || [];
    const stats = {
      harshBraking: allEvents.filter((e:any) => e.type === 'harsh_braking' || e.type === 'braking').length,
      harshAccel: allEvents.filter((e:any) => e.type === 'harsh_accel' || e.type === 'harsh_acceleration').length,
      harshTurn: allEvents.filter((e:any) => e.type === 'harsh_turn' || e.type === 'turn').length,
      totalEvents: allEvents.length
    };

    trip.totalKm = parseFloat(totalKm.toFixed(2));
    (trip as any).stats = stats;
    trip.endTime = new Date();
    (trip as any).status = 'completed';
    (trip as any).finalScore = Math.max(0, 100 - stats.totalEvents * 10);
    
    if (totalKm < 0.1) {
      trip.milesEarned = 1;
    } else {
      trip.milesEarned = Math.max(1, Math.floor(totalKm * 10));
    }

    await trip.save();

    try {
      await this.rewardsService.addMiles(trip.userId, trip.milesEarned, `Trip ${tripId} completed - ${totalKm.toFixed(2)}km`);
    } catch (e) {
      console.error("Rewards credit failed", e);
    }

    console.log(`Trip ${tripId}: ${trip.points.length} pts, ${validSegments} valid, ${totalKm.toFixed(3)} km, B:${stats.harshBraking} A:${stats.harshAccel} T:${stats.harshTurn}`);

    return trip;
  }

  async getUserTrips(userId: string) {
    return this.tripModel.find({ userId }).sort({ startTime: -1 }).exec();
  }

  async getTrip(id: string) {
    return this.tripModel.findById(id).exec();
  }

  async getAllTrips() {
    return this.tripModel.find().sort({ startTime: -1 }).limit(20).exec();
  }
}