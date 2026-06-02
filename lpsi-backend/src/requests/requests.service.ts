import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import type { User } from '@prisma/client';
import { CreateRequestDto } from './dto/create-request.dto';
import { format } from 'date-fns';

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private activityLog: ActivityLogService,
  ) {}

  private async generateNomorPermohonan(): Promise<string> {
    const now = new Date();
    const prefix = `LPSI-${format(now, 'yyMM')}-`;
    const count = await this.prisma.labRequest.count({
      where: { nomorPermohonan: { startsWith: prefix } },
    });
    const seq = String(count + 1).padStart(3, '0');
    return `${prefix}${seq}`;
  }

  async findAll(user: User) {
    const requests = await this.prisma.labRequest.findMany({
      where: { userId: user.id },
      include: { samples: true },
      orderBy: { createdAt: 'desc' },
    });
    return { statusCode: 200, message: 'Daftar permohonan berhasil diambil', data: requests };
  }

  async findOne(id: number, user: User) {
    const request = await this.prisma.labRequest.findUnique({
      where: { id },
      include: { samples: true, ikm: true },
    });
    if (!request) throw new NotFoundException('Permohonan tidak ditemukan');
    if (user.role !== 'ADMIN' && request.userId !== user.id)
      throw new ForbiddenException('Akses ditolak');
    return { statusCode: 200, message: 'Detail permohonan berhasil diambil', data: request };
  }

  async create(dto: CreateRequestDto, user: User, suratPengantar?: string) {
    const nomorPermohonan = await this.generateNomorPermohonan();

    const request = await this.prisma.labRequest.create({
      data: {
        nomorPermohonan,
        userId: user.id,
        namaPemohon: dto.namaPemohon,
        alamat: dto.alamat,
        noHp: dto.noHp,
        emailPemohon: dto.emailPemohon,
        tanggalPermohonan: new Date(dto.tanggalPermohonan),
        suratPengantar,
        samples: {
          create: dto.samples.map((s) => ({
            kategori: s.kategori,
            namaSampel: s.namaSampel,
            beratBasah: s.beratBasah,
            beratKering: s.beratKering,
            kemasan: s.kemasan,
            jenisUji: s.jenisUji,
            hargaTotal: s.hargaTotal,
          })),
        },
      },
      include: { samples: true },
    });

    await this.activityLog.log(
      request.id,
      'PERMOHONAN_DIBUAT',
      `Permohonan dibuat oleh ${user.nama} dengan ${request.samples.length} sampel.${suratPengantar ? ' Surat pengantar dilampirkan.' : ''}`,
    );

    try {
      await this.notifications.sendWithEmail(
        user.id,
        'PERMOHONAN_DIBUAT',
        `Permohonan ${nomorPermohonan} berhasil dibuat. Silakan kirim sampel ke laboratorium.`,
        user.email,
        'Permohonan Berhasil Dibuat — LPSI',
        'permohonan-dibuat',
        { nama: user.nama, nomorPermohonan, jumlahSampel: request.samples.length },
      );
    } catch {}

    return { statusCode: 201, message: 'Permohonan berhasil dibuat', data: request };
  }

  async uploadBuktiBayar(id: number, user: User, filename: string) {
    const request = await this.prisma.labRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Permohonan tidak ditemukan');
    if (request.userId !== user.id) throw new ForbiddenException('Akses ditolak');
    if (request.status !== 'MENUNGGU_PEMBAYARAN')
      throw new BadRequestException('Permohonan belum dalam status menunggu pembayaran');

    const updated = await this.prisma.labRequest.update({
      where: { id },
      data: { buktiBayar: filename },
    });

    await this.activityLog.log(id, 'BUKTI_BAYAR_DIUNGGAH', 'Pemohon mengunggah bukti pembayaran. Menunggu konfirmasi admin.');

    try {
      await this.notifications.create(
        user.id,
        'BUKTI_BAYAR_DIUNGGAH',
        `Bukti bayar untuk ${request.nomorPermohonan} berhasil diunggah. Menunggu konfirmasi admin.`,
      );
    } catch {}

    return { statusCode: 200, message: 'Bukti bayar berhasil diunggah', data: updated };
  }

  async setKirimLhpFisik(id: number, user: User, kirim: boolean) {
    const request = await this.prisma.labRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Permohonan tidak ditemukan');
    if (request.userId !== user.id) throw new ForbiddenException('Akses ditolak');
    const data = await this.prisma.labRequest.update({
      where: { id },
      data: { kirimLhpFisik: kirim },
    });
    await this.activityLog.log(
      id,
      'PREFERENSI_KIRIM_LHP',
      kirim
        ? 'Pemohon memilih LHP dikirim secara fisik (COD).'
        : 'Pemohon memilih LHP tidak perlu dikirim fisik (hanya digital).',
    );
    return { statusCode: 200, message: 'Preferensi pengiriman LHP disimpan', data };
  }

  async submitIkm(id: number, user: User, jawaban: object) {
    const request = await this.prisma.labRequest.findUnique({
      where: { id },
      include: { ikm: true },
    });
    if (!request) throw new NotFoundException('Permohonan tidak ditemukan');
    if (request.userId !== user.id) throw new ForbiddenException('Akses ditolak');
    if (request.status !== 'SELESAI')
      throw new BadRequestException('IKM hanya bisa diisi setelah permohonan selesai');
    if (request.ikm) throw new BadRequestException('IKM sudah pernah diisi');

    const ikm = await this.prisma.iKM.create({
      data: { requestId: id, jawaban },
    });

    await this.activityLog.log(id, 'SKM_DIISI', 'Pemohon mengisi Survei Kepuasan Masyarakat (SKM).');

    return { statusCode: 201, message: 'IKM berhasil disimpan', data: ikm };
  }

  async getLogs(id: number, user: User) {
    const request = await this.prisma.labRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Permohonan tidak ditemukan');
    if (user.role !== 'ADMIN' && request.userId !== user.id)
      throw new ForbiddenException('Akses ditolak');
    const logs = await this.activityLog.getByRequest(id);
    return { statusCode: 200, message: 'Log aktivitas berhasil diambil', data: logs };
  }
}
