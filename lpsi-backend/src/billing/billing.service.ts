import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class BillingService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private activityLog: ActivityLogService,
  ) {}

  async inputBilling(id: number, eBillingFile?: string) {
    const request = await this.prisma.labRequest.findUnique({
      where: { id },
      include: { user: { select: { nama: true, email: true } } },
    });
    if (!request) throw new NotFoundException('Permohonan tidak ditemukan');
    if (!['VERIFIKASI', 'MENUNGGU_BILLING'].includes(request.status))
      throw new BadRequestException('Permohonan belum dalam status yang sesuai untuk penerbitan billing');
    if (!eBillingFile)
      throw new BadRequestException('File PDF e-billing wajib diunggah');

    const updated = await this.prisma.labRequest.update({
      where: { id },
      data: { eBillingFile, status: 'MENUNGGU_PEMBAYARAN' },
    });

    await this.activityLog.log(
      id,
      'BILLING_DITERBITKAN',
      'Admin mengunggah file e-billing. Status berubah menjadi Menunggu Pembayaran.',
    );

    try {
      await this.notifications.sendWithEmail(
        request.userId,
        'BILLING_TERSEDIA',
        `E-billing untuk ${request.nomorPermohonan} telah diterbitkan. Silakan buka tab Pembayaran untuk melihat dan melakukan pembayaran.`,
        request.user.email,
        'E-Billing Diterbitkan — LPSI',
        'billing-tersedia',
        { nama: request.user.nama, nomorPermohonan: request.nomorPermohonan },
      );
    } catch {}

    return { statusCode: 200, message: 'E-billing berhasil diunggah', data: updated };
  }

  async konfirmasiBayar(id: number) {
    const request = await this.prisma.labRequest.findUnique({
      where: { id },
      include: { user: { select: { nama: true, email: true } } },
    });
    if (!request) throw new NotFoundException('Permohonan tidak ditemukan');
    if (request.status !== 'MENUNGGU_PEMBAYARAN')
      throw new BadRequestException('Permohonan belum dalam status menunggu pembayaran');
    if (!request.buktiBayar)
      throw new BadRequestException('Bukti bayar belum diunggah oleh pemohon');

    const updated = await this.prisma.labRequest.update({
      where: { id },
      data: { status: 'LUNAS' },
    });

    await this.activityLog.log(
      id,
      'PEMBAYARAN_DIKONFIRMASI',
      'Admin mengkonfirmasi pembayaran. Status berubah menjadi Lunas.',
    );

    try {
      await this.notifications.sendWithEmail(
        request.userId,
        'PEMBAYARAN_DIKONFIRMASI',
        `Pembayaran untuk ${request.nomorPermohonan} telah dikonfirmasi. Analisis sampel akan segera dimulai.`,
        request.user.email,
        'Pembayaran Dikonfirmasi — LPSI',
        'pembayaran-dikonfirmasi',
        { nama: request.user.nama, nomorPermohonan: request.nomorPermohonan },
      );
    } catch {}

    return { statusCode: 200, message: 'Pembayaran berhasil dikonfirmasi', data: updated };
  }
}
