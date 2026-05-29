import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(user: User) {
    const { password, activateToken, resetToken, ...profile } = user;
    return { statusCode: 200, message: 'Profil berhasil diambil', data: profile };
  }
}
