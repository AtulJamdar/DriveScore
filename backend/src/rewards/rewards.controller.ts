import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RewardsService } from './rewards.service';

@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get(':userId')
  async getWallet(@Param('userId') userId: string) {
    return this.rewardsService.getWallet(userId);
  }

  @Post('redeem')
  async redeem(@Body() body: { userId: string; milesNeeded: number; voucherName: string }) {
    return this.rewardsService.redeemMiles(body.userId, body.milesNeeded, body.voucherName);
  }
}