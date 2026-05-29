import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { VerifySampleDto } from './dto/verify-sample.dto';

@Injectable()
export class SamplesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
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
    if (allProcessed) {
      await this.prisma.labRequest.update({
        where: { id: sample.requestId },
        data: { status: 'VERIFIKASI' },
      });
    }

    try {
      const nom = sample.request.nomorPermohonan;
      const statusLabel = dto.status === 'DITOLAK' ? 'Ditolak' : dto.status === 'OK' ? 'OK' : 'Diterima';
      const msg =
        dto.status === 'DITOLAK'
          ? `Sampel "${sample.namaSampel}" pada ${nom} ditolak. Alasan: ${dto.alasanTolak}`
          : `Sampel "${sample.namaSampel}" pada ${nom} telah diverifikasi (${statusLabel}).`;

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
