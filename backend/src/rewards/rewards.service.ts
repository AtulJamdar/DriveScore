import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reward, RewardDocument } from './schemas/reward.schema';

@Injectable()
export class RewardsService {
  constructor(@InjectModel(Reward.name) private rewardModel: Model<RewardDocument>) {}

  async addMiles(userId: string, miles: number, reason: string) {
    let wallet = await this.rewardModel.findOne({ userId });
    if(!wallet) wallet = await this.rewardModel.create({ userId, milesBalance: 0, history: [] });
    wallet.milesBalance += miles;
    // FIX: 'at' nahi 'date' hai schema me
    wallet.history.push({ 
      reason, 
      amount: miles, 
      type: 'earned', 
      date: new Date() 
    } as any);
    await wallet.save();
    return wallet;
  }

  async getWallet(userId: string) {
    let wallet = await this.rewardModel.findOne({ userId });
    if (!wallet) {
      wallet = await this.rewardModel.create({ userId, milesBalance: 0, history: [] });
    }
    return wallet;
  }

  async redeemMiles(userId: string, milesNeeded: number, voucherName: string) {
    const wallet = await this.getWallet(userId);

    if (wallet.milesBalance < milesNeeded) {
      throw new BadRequestException('Not enough miles to redeem!');
    }

    wallet.milesBalance -= milesNeeded;
    wallet.history.push({
      type: 'redeemed',
      amount: milesNeeded,
      reason: `Redeemed: ${voucherName}`,
      date: new Date(),
    } as any);

    return await wallet.save();
  }
}