import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
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
      select: { id: true, nama: true, email: true, isActive: true, resetRequested: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return { statusCode: 200, message: 'Daftar akun pemohon', data: users };
  }

  async approveReset(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    const token = uuidv4();
    await this.prisma.user.update({
      where: { id },
      data: { resetToken: token, resetRequested: false },
    });
    return { statusCode: 200, message: 'Permintaan reset password disetujui. Pemohon dapat mereset password sekarang.' };
  }

  async rejectReset(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    await this.prisma.user.update({
      where: { id },
      data: { resetRequested: false, resetToken: null },
    });
    return { statusCode: 200, message: 'Permintaan reset password ditolak.' };
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
