import { Controller, Get, Post, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { TripsService } from './trips.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@UseGuards(FirebaseAuthGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get('user/:userId')
  async getUserTrips(@Param('userId') userId: string, @Req() req: any) {
    // Security: user can only fetch his own trips
    if (req.user.uid !== userId) {
      throw new ForbiddenException('You can only view your own trips');
    }
    return this.tripsService.getUserTrips(userId);
  }

  @Get(':id')
  async getTrip(@Param('id') id: string, @Req() req: any) {
    // Optional: check if trip belongs to req.user.uid inside service
    return this.tripsService.getTrip(id);
  }

  @Get()
  async getAllTrips(@Req() req: any) {
    // Now returns only logged-in user's trips, not all
    return this.tripsService.getUserTrips(req.user.uid);
  }

  @Post('start')
  async startTrip(@Req() req: any) {
    // userId from token, not from body - secure
    return this.tripsService.startTrip(req.user.uid);
  }

  @Post(':id/point')
  async addPoint(
    @Param('id') id: string,
    @Body() point: { lat: number; lng: number; speed: number; timestamp: number; bearing: number },
    @Req() req: any,
  ) {
    return this.tripsService.addPoint(id, point);
  }

  @Post(':id/event')
  async addEvent(
    @Param('id') id: string,
    @Body() eventDto: { type: 'harsh_braking' | 'harsh_accel' | 'harsh_turn'; at?: number },
    @Req() req: any,
  ) {
    return this.tripsService.addEvent(id, eventDto);
  }

  @Post(':id/end')
  async endTrip(@Param('id') id: string, @Req() req: any) {
    return this.tripsService.endTrip(id);
  }
}