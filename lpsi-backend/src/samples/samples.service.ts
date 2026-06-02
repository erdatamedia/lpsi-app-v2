import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { VerifySampleDto } from './dto/verify-sample.dto';

@Injectable()
export class SamplesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private activityLog: ActivityLogService,
  ) {}

  async verify(id: number, dto: VerifySampleDto) {
    const sample = await this.prisma.sample.findUnique({
      where: { id },
      include: {
        request: {
          include: {
            samples: true,
            user: { select: { nama: true, email: true } },
          },
        },
      },
    });
    if (!sample) throw new NotFoundException('Sampel tidak ditemukan');
    if (sample.status === 'OK' || sample.status === 'DITOLAK')
      throw new BadRequestException('Sampel sudah diverifikasi final');
    if (dto.status === 'DITOLAK' && !dto.alasanTolak)
      throw new BadRequestException('Alasan penolakan harus diisi');

    const updated = await this.prisma.sample.update({
      where: { id },
      data: { status: dto.status, alasanTolak: dto.alasanTolak ?? null },
    });

    const allSamples = sample.request.samples.map((s) =>
      s.id === id ? { ...s, status: dto.status } : s,
    );
    const allProcessed = allSamples.every((s) => s.status === 'OK' || s.status === 'DITOLAK');

    // Log verifikasi per sampel
    const statusLabel = dto.status === 'DITOLAK' ? 'Ditolak' : dto.status === 'OK' ? 'OK' : 'Diterima';
    await this.activityLog.log(
      sample.requestId,
      'SAMPEL_DIVERIFIKASI',
      dto.status === 'DITOLAK'
        ? `Sampel "${sample.namaSampel}" dinyatakan Ditolak. Alasan: ${dto.alasanTolak}.`
        : `Sampel "${sample.namaSampel}" dinyatakan ${statusLabel}.`,
    );

    if (allProcessed) {
      const anyDitolak = allSamples.some((s) => s.status === 'DITOLAK');
      if (anyDitolak) {
        const ditolakIds = allSamples.filter((s) => s.status === 'DITOLAK').map((s) => s.id);
        await this.prisma.sample.updateMany({
          where: { id: { in: ditolakIds } },
          data: { status: 'MENUNGGU' },
        });
        await this.prisma.labRequest.update({
          where: { id: sample.requestId },
          data: { status: 'MENUNGGU_SAMPEL' },
        });
        const namaditolak = allSamples.filter(s => s.status === 'DITOLAK').map(s => `"${s.namaSampel}"`).join(', ');
        await this.activityLog.log(
          sample.requestId,
          'VERIFIKASI_TIDAK_LOLOS',
          `Verifikasi selesai — sampel ${namaditolak} tidak lolos. Pemohon diminta mengirim ulang sampel.`,
        );
      } else {
        await this.prisma.labRequest.update({
          where: { id: sample.requestId },
          data: { status: 'VERIFIKASI' },
        });
        await this.activityLog.log(
          sample.requestId,
          'VERIFIKASI_LOLOS',
          'Semua sampel lolos verifikasi. Permohonan siap proses billing.',
        );
      }
    }

    try {
      const nom = sample.request.nomorPermohonan;
      const msg =
        dto.status === 'DITOLAK'
          ? `Sampel "${sample.namaSampel}" pada ${nom} ditolak. Alasan: ${dto.alasanTolak}. Silakan kirim ulang sampel.`
          : `Sampel "${sample.namaSampel}" pada ${nom} telah diverifikasi (${statusLabel}). Silakan lakukan pembayaran.`;

      await this.notifications.sendWithEmail(
        sample.request.userId,
        'VERIFIKASI_SAMPEL',
        msg,
        sample.request.user.email,
        'Pembaruan Verifikasi Sampel — LPSI',
        'verifikasi-sampel',
        {
          nama: sample.request.user.nama,
          nomorPermohonan: nom,
          namaSampel: sample.namaSampel,
          status: statusLabel,
          alasanTolak: dto.alasanTolak,
          ditolak: dto.status === 'DITOLAK',
        },
      );
    } catch {}

    return { statusCode: 200, message: 'Verifikasi sampel berhasil', data: updated };
  }

  async uploadLhp(id: number, filename: string) {
    const sample = await this.prisma.sample.findUnique({
      where: { id },
      include: {
        request: {
          include: { user: { select: { nama: true, email: true } } },
        },
      },
    });
    if (!sample) throw new NotFoundException('Sampel tidak ditemukan');

    const updated = await this.prisma.sample.update({
      where: { id },
      data: { lhpFile: filename },
    });

    await this.activityLog.log(
      sample.requestId,
      'LHP_DIUNGGAH',
      `LHP untuk sampel "${sample.namaSampel}" berhasil diunggah oleh admin.`,
    );

    try {
      await this.notifications.sendWithEmail(
        sample.request.userId,
        'LHP_TERSEDIA',
        `LHP untuk sampel "${sample.namaSampel}" pada ${sample.request.nomorPermohonan} sudah tersedia.`,
        sample.request.user.email,
        'Laporan Hasil Pengujian Tersedia — LPSI',
        'lhp-tersedia',
        {
          nama: sample.request.user.nama,
          nomorPermohonan: sample.request.nomorPermohonan,
          namaSampel: sample.namaSampel,
        },
      );
    } catch {}

    return { statusCode: 200, message: 'LHP berhasil diunggah', data: updated };
  }
}
