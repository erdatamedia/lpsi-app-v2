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

  async inputBilling(id: number, kodeBilling: string, totalTagihan: number, eBillingFile?: string) {
    const request = await this.prisma.labRequest.findUnique({
      where: { id },
      include: { user: { select: { nama: true, email: true } } },
    });
    if (!request) throw new NotFoundException('Permohonan tidak ditemukan');
    if (request.status !== 'VERIFIKASI')
      throw new BadRequestException('Permohonan belum dalam status verifikasi');

    const updated = await this.prisma.labRequest.update({
      where: { id },
      data: {
        kodeBilling,
        totalTagihan,
        status: 'MENUNGGU_PEMBAYARAN',
        ...(eBillingFile ? { eBillingFile } : {}),
      },
    });

    await this.activityLog.log(
      id,
      'BILLING_DITERBITKAN',
      `Kode billing diterbitkan oleh admin. Kode: ${kodeBilling}, Total tagihan: Rp ${Number(totalTagihan).toLocaleString('id-ID')}.${eBillingFile ? ' File e-billing dilampirkan.' : ''}`,
    );

    try {
      await this.notifications.sendWithEmail(
        request.userId,
        'BILLING_TERSEDIA',
        `Tagihan untuk ${request.nomorPermohonan} telah diterbitkan. Kode billing: ${kodeBilling}. Total: Rp ${Number(totalTagihan).toLocaleString('id-ID')}. Silakan lakukan pembayaran.`,
        request.user.email,
        'Tagihan PNBP Diterbitkan — LPSI',
        'billing-tersedia',
        {
          nama: request.user.nama,
          nomorPermohonan: request.nomorPermohonan,
          kodeBilling,
          totalTagihan: Number(totalTagihan).toLocaleString('id-ID'),
        },
      );
    } catch {}

    return { statusCode: 200, message: 'Kode billing berhasil diinput', data: updated };
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
