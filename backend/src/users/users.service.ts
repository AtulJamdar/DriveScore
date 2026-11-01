import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findOrCreate(
    firebaseUid: string,
    email: string,
    displayName?: string,
  ): Promise<UserDocument> {
    let user = await this.userModel.findOne({ firebaseUid }).exec();
    if (!user) {
      user = await this.userModel.create({
        firebaseUid,
        email,
        displayName,
        totalMiles: 0,
        avgScore: 100,
      });
    }
    return user;
  }

  async findByUid(uid: string): Promise<UserDocument | null> {
    let user = await this.userModel.findOne({ firebaseUid: uid }).exec();
    if (!user && uid?.match(/^[0-9a-fA-F]{24}$/)) {
      user = await this.userModel.findById(uid).exec();
    }
    return user;
  }

  async updateStats(
    uid: string,
    miles: number,
    score: number,
  ): Promise<UserDocument> {
    const user = await this.findByUid(uid);
    if (!user) {
      throw new NotFoundException(`User with uid ${uid} not found`);
    }

    user.totalMiles = (user.totalMiles || 0) + miles;
    user.avgScore = score;
    return user.save();
  }
}
