import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';
import { startOfMonth, endOfMonth, subMonths, differenceInDays, format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

const PERLU_TINDAKAN_STATUSES = [
  'SAMPEL_DITERIMA',
  'VERIFIKASI',
  'MENUNGGU_BILLING',
  'LUNAS',
  'ON_PROGRESS',
] as const;

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics() {
    const now = new Date();
    const startThisMonth = startOfMonth(now);
    const startLastMonth = startOfMonth(subMonths(now, 1));
    const endLastMonth = endOfMonth(subMonths(now, 1));

    const [
      totalRequests,
      byStatus,
      totalRevenue,
      totalSamples,
      perluTindakan,
      selesaiRequests,
      permohonanBulanIni,
      permohonanBulanLalu,
      monthlyTrend,
    ] = await Promise.all([
      this.prisma.labRequest.count(),
      this.prisma.labRequest.groupBy({ by: ['status'], _count: { status: true } }),
      this.prisma.labRequest.aggregate({
        _sum: { totalTagihan: true },
        where: { status: { in: ['LUNAS', 'ON_PROGRESS', 'SELESAI'] } },
      }),
      this.prisma.sample.count(),
      this.prisma.labRequest.count({ where: { status: { in: [...PERLU_TINDAKAN_STATUSES] } } }),
      this.prisma.labRequest.findMany({
        where: { status: 'SELESAI' },
        select: { createdAt: true, updatedAt: true },
      }),
      this.prisma.labRequest.count({ where: { createdAt: { gte: startThisMonth } } }),
      this.prisma.labRequest.count({ where: { createdAt: { gte: startLastMonth, lte: endLastMonth } } }),
      Promise.all(
        Array.from({ length: 6 }, async (_, i) => {
          const target = subMonths(now, 5 - i);
          const count = await this.prisma.labRequest.count({
            where: { createdAt: { gte: startOfMonth(target), lte: endOfMonth(target) } },
          });
          return { label: format(target, 'MMM yyyy', { locale: localeID }), count };
        }),
      ),
    ]);

    const avgProcessingDays = selesaiRequests.length
      ? selesaiRequests.reduce((sum, r) => sum + differenceInDays(r.updatedAt, r.createdAt), 0) /
        selesaiRequests.length
      : 0;

    return {
      statusCode: 200,
      message: 'Metrik dashboard berhasil diambil',
      data: {
        totalRequests,
        byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count.status])),
        totalRevenue: totalRevenue._sum.totalTagihan ?? 0,
        totalSamples,
        perluTindakan,
        avgProcessingDays: Math.round(avgProcessingDays * 10) / 10,
        permohonanBulanIni,
        permohonanBulanLalu,
        monthlyTrend,
      },
    };
  }

  async getSetting(key: string) {
    const s = await this.prisma.setting.findUnique({ where: { key } });
    return { statusCode: 200, message: 'OK', data: s };
  }

  async updateSetting(key: string, value: string) {
    const s = await this.prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
    return { statusCode: 200, message: 'Setting berhasil diperbarui', data: s };
  }

  async getSkmPertanyaan() {
    const data = await this.prisma.skmPertanyaan.findMany({ orderBy: { urutan: 'asc' } });
    return { statusCode: 200, message: 'OK', data };
  }

  async createSkmPertanyaan(label: string, urutan: number) {
    const data = await this.prisma.skmPertanyaan.create({ data: { label, urutan } });
    return { statusCode: 201, message: 'Pertanyaan ditambahkan', data };
  }

  async updateSkmPertanyaan(id: number, label?: string, urutan?: number, isActive?: boolean) {
    const data = await this.prisma.skmPertanyaan.update({ where: { id }, data: { label, urutan, isActive } });
    return { statusCode: 200, message: 'Pertanyaan diperbarui', data };
  }

  async deleteSkmPertanyaan(id: number) {
    await this.prisma.skmPertanyaan.delete({ where: { id } });
    return { statusCode: 200, message: 'Pertanyaan dihapus' };
  }

  async exportExcel(): Promise<Buffer> {
    const requests = await this.prisma.labRequest.findMany({
      include: { user: { select: { nama: true, email: true } }, samples: true },
      orderBy: { createdAt: 'asc' },
    });

    const rows = requests.flatMap((req) =>
      req.samples.map((s) => ({
        'Nomor Permohonan': req.nomorPermohonan,
        'Nama Pemohon': req.namaPemohon,
        'Email Pemohon': req.emailPemohon,
        'No. HP': req.noHp,
        Alamat: req.alamat,
        'Tanggal Permohonan': new Date(req.tanggalPermohonan).toLocaleDateString('id-ID'),
        'Status Permohonan': req.status,
        'Kode Billing': req.kodeBilling ?? '',
        'Total Tagihan (Rp)': req.totalTagihan ? Number(req.totalTagihan) : 0,
        'Nama Sampel': s.namaSampel,
        Kategori: s.kategori,
        'Jenis Uji': Array.isArray(s.jenisUji) ? (s.jenisUji as string[]).join(', ') : String(s.jenisUji),
        'Harga Sampel (Rp)': Number(s.hargaTotal),
        'Status Sampel': s.status,
        'Alasan Tolak': s.alasanTolak ?? '',
        'Ada LHP': s.lhpFile ? 'Ya' : 'Tidak',
      })),
    );

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Permohonan');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return buf as Buffer;
  }
}
