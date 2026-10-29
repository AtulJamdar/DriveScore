import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TripsModule } from './trips/trips.module';
import { RewardsModule } from './rewards/rewards.module';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY ?? 'YOUR_APP_KEY',
      appSecret: process.env.OBSERVE_APP_SECRET ?? 'YOUR_APP_SECRET',
      serviceId: 'backend',
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/drivescore'),
    TripsModule,
    RewardsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
