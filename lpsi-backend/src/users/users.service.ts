import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '@prisma/client';

export interface UpdateProfileDto {
  nama?: string;
  jenisKelamin?: string;
  tanggalLahir?: string;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(user: User) {
    const { password, activateToken, resetToken, ...profile } = user;
    return { statusCode: 200, message: 'Profil berhasil diambil', data: profile };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const data = await this.prisma.user.update({
      where: { id: userId },
      data: {
        nama: dto.nama,
        jenisKelamin: dto.jenisKelamin,
        tanggalLahir: dto.tanggalLahir ? new Date(dto.tanggalLahir) : undefined,
      },
    });
    const { password, activateToken, resetToken, ...profile } = data;
    return { statusCode: 200, message: 'Profil berhasil diperbarui', data: profile };
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({
      where: { role: 'PEMOHON' },
      select: { id: true, nama: true, email: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return { statusCode: 200, message: 'Daftar akun pemohon', data: users };
  }

  async toggleActivate(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User tidak ditemukan');
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, nama: true, email: true, isActive: true },
    });
    const msg = updated.isActive ? 'Akun berhasil diaktifkan' : 'Akun berhasil dinonaktifkan';
    return { statusCode: 200, message: msg, data: updated };
  }
}
