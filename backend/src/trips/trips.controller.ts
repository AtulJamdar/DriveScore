import { Controller, Post, Body, Param } from '@nestjs/common';
import { TripsService } from './trips.service';

@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

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

  @Post(':id/end')
  async endTrip(@Param('id') id: string) {
    return this.tripsService.endTrip(id);
  }
}