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

        // Pehle pata karo kaunsa event hone wala hai
        let wouldBeType: string | null = null;
        if (accel < -3.5) wouldBeType = 'harsh_braking';
        else if (accel > 3.0) wouldBeType = 'harsh_accel';
        else {
          const bearingDiff = Math.abs(point.bearing - prevPoint.bearing);
          const normalizedDiff = bearingDiff > 180 ? 360 - bearingDiff : bearingDiff;
          if (normalizedDiff > 60 && point.speed > 25) wouldBeType = 'harsh_turn';
        }

        // FIX: Cooldown check - 5 sec me same type ka event dobara mat kaat
        if (wouldBeType) {
          const lastEv = trip.events[trip.events.length - 1];
          if (lastEv && lastEv.type === wouldBeType) {
            const timeSinceLastEvent = point.timestamp - lastEv.at;
            if (timeSinceLastEvent < 5000) {
              await trip.save();
              return { success: true, currentScore: trip.score };
            }
          }

          // Agar cooldown clear hai toh hi event push karo
          if (wouldBeType === 'harsh_braking') {
            trip.events.push({ type: 'harsh_braking', at: point.timestamp });
            trip.score = Math.max(0, trip.score - 10);
          } else if (wouldBeType === 'harsh_accel') {
            trip.events.push({ type: 'harsh_accel', at: point.timestamp });
            trip.score = Math.max(0, trip.score - 8);
          } else if (wouldBeType === 'harsh_turn') {
            trip.events.push({ type: 'harsh_turn', at: point.timestamp });
            trip.score = Math.max(0, trip.score - 12);
          }
        }
      }
    }

    await trip.save();
    return { success: true, currentScore: trip.score, lastEvent: trip.events[trip.events.length - 1] };
  }

  async endTrip(tripId: string) {
    const trip = await this.tripModel.findById(tripId);
    if (!trip) throw new NotFoundException('Trip not found');

    let totalKm = 0;
    let validSegments = 0;
    
    for (let i = 1; i < trip.points.length; i++) {
      const segmentKm = this.haversine(
        trip.points[i-1].lat, trip.points[i-1].lng,
        trip.points[i].lat, trip.points[i].lng
      );
      
      // FIX 1: GPS glitch filter - agar ek jump 1km se zyada hai toh ignore karo
      // Nahi toh 732 miles jaisa bug aayega
      // FIX 2: Bahut chota jump <5 meter bhi ignore (GPS jitter)
      if (segmentKm < 1 && segmentKm > 0.005) {
        totalKm += segmentKm;
        validSegments++;
      }
    }

    trip.endTime = new Date();
    // FIX: 1 km = 10 miles, aur kam se kam 1 mile toh milega hi
    // Pehle Math.floor(totalKm) tha, isliye choti trip pe 0 miles milta tha
    // Ab totalKm 2.5km hai toh 25 miles milega
    trip.milesEarned = Math.max(1, Math.floor(totalKm * 10));
    
    // Safety: Agar totalKm 0 hai (khadi gaadi) toh 1 hi mile do
    if (totalKm < 0.1) {
      trip.milesEarned = 1;
    }

    await trip.save();

    // Rewards wallet me credit karo
    if (trip.milesEarned > 0) {
      try {
        await this.rewardsService.addMiles(trip.userId, trip.milesEarned, `Trip ${tripId} completed - ${totalKm.toFixed(2)}km`);
      } catch (e) {
        console.error("Rewards credit failed", e);
      }
    }

    console.log(`Trip ${tripId}: ${trip.points.length} points, ${validSegments} valid segments, ${totalKm.toFixed(3)} km => ${trip.milesEarned} miles`);

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