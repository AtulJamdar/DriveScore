import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TripsService } from './trips.service';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get('user/:userId')
  async getUserTrips(@Param('userId') userId: string) {
    return this.tripsService.getUserTrips(userId); // tripModel nahi, tripsService use kar
  }

  @Get(':id')
  async getTrip(@Param('id') id: string) {
    return this.tripsService.getTrip(id);
  }

  @Get()
  async getAllTrips() {
    return this.tripsService.getAllTrips();
  }

  @Post('start')
  async startTrip(@Body('userId') userId: string) {
    return this.tripsService.startTrip(userId);
  }

  @Post(':id/point')
  async addPoint(
    @Param('id') id: string,
    @Body() point: { lat: number; lng: number; speed: number; timestamp: number; bearing: number },
  ) {
    return this.tripsService.addPoint(id, point);
  }

  @Post(':id/event')
  async addEvent(
    @Param('id') id: string,
    @Body() eventDto: { type: 'harsh_braking' | 'harsh_accel' | 'harsh_turn'; at?: number },
  ) {
    return this.tripsService.addEvent(id, eventDto);
  }

  @Post(':id/end')
  async endTrip(@Param('id') id: string) {
    return this.tripsService.endTrip(id);
  }
}
