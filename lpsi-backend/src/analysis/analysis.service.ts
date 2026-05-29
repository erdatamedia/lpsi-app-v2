import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { REQUEST_STATUS_LABEL } from './constants';
import type { RequestStatus } from '@prisma/client';

@Injectable()
export class AnalysisService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async updateStatus(id: number, status: RequestStatus) {
    const request = await this.prisma.labRequest.findUnique({
      where: { id },
      include: { user: { select: { nama: true, email: true } } },
    });
    if (!request) throw new NotFoundException('Permohonan tidak ditemukan');

    const updated = await this.prisma.labRequest.update({ where: { id }, data: { status } });

    try {
      const statusLabel = REQUEST_STATUS_LABEL[status] ?? status;
      await this.notifications.sendWithEmail(
        request.userId,
        'STATUS_DIPERBARUI',
        `Status permohonan ${request.nomorPermohonan} diperbarui menjadi: ${statusLabel}.`,
        request.user.email,
        `Status Permohonan: ${statusLabel} — LPSI`,
        'status-diperbarui',
        {
          nama: request.user.nama,
          nomorPermohonan: request.nomorPermohonan,
          statusLabel,
        },
      );
    } catch {}

    return { statusCode: 200, message: 'Status permohonan berhasil diperbarui', data: updated };
  }

  async findAll() {
    const requests = await this.prisma.labRequest.findMany({
      include: { user: { select: { nama: true, email: true } }, samples: true },
      orderBy: { createdAt: 'desc' },
    });
    return { statusCode: 200, message: 'Daftar semua permohonan berhasil diambil', data: requests };
  }
}
