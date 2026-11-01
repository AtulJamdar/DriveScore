import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  async getMe(@Req() req: any) {
    const uid = req.user?.uid || req.user?.firebaseUid;
    const user = await this.usersService.findByUid(uid);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Post('sync')
  @UseGuards(FirebaseAuthGuard)
  async sync(
    @Req() req: any,
    @Body() body?: { displayName?: string },
  ) {
    const uid = req.user?.uid || req.user?.firebaseUid;
    const email = req.user?.email;
    const displayName =
      body?.displayName ?? req.user?.displayName ?? req.user?.name;

    return this.usersService.findOrCreate(uid, email, displayName);
  }
}
