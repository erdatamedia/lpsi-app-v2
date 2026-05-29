import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLayananDto, UpdateLayananDto, CreateLayananItemDto, UpdateLayananItemDto } from './dto/layanan.dto';

@Injectable()
export class LayananService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const data = await this.prisma.layanan.findMany({
      include: { items: { orderBy: { urutan: 'asc' } } },
      orderBy: { urutan: 'asc' },
    });
    return { statusCode: 200, message: 'Daftar layanan berhasil diambil', data };
  }

  async create(dto: CreateLayananDto) {
    const count = await this.prisma.layanan.count();
    const data = await this.prisma.layanan.create({
      data: { kategori: dto.kategori, urutan: dto.urutan ?? count + 1 },
      include: { items: true },
    });
    return { statusCode: 201, message: 'Kategori layanan berhasil dibuat', data };
  }

  async update(id: number, dto: UpdateLayananDto) {
    await this.findOneOrFail(id);
    const data = await this.prisma.layanan.update({
      where: { id },
      data: dto,
      include: { items: { orderBy: { urutan: 'asc' } } },
    });
    return { statusCode: 200, message: 'Kategori layanan berhasil diperbarui', data };
  }

  async remove(id: number) {
    await this.findOneOrFail(id);
    await this.prisma.layanan.delete({ where: { id } });
    return { statusCode: 200, message: 'Kategori layanan berhasil dihapus' };
  }

  async createItem(layananId: number, dto: CreateLayananItemDto) {
    await this.findOneOrFail(layananId);
    const count = await this.prisma.layananItem.count({ where: { layananId } });
    const data = await this.prisma.layananItem.create({
      data: { layananId, nama: dto.nama, urutan: dto.urutan ?? count + 1 },
    });
    return { statusCode: 201, message: 'Item layanan berhasil ditambahkan', data };
  }

  async updateItem(itemId: number, dto: UpdateLayananItemDto) {
    const item = await this.prisma.layananItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item layanan tidak ditemukan');
    const data = await this.prisma.layananItem.update({ where: { id: itemId }, data: dto });
    return { statusCode: 200, message: 'Item layanan berhasil diperbarui', data };
  }

  async removeItem(itemId: number) {
    const item = await this.prisma.layananItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item layanan tidak ditemukan');
    await this.prisma.layananItem.delete({ where: { id: itemId } });
    return { statusCode: 200, message: 'Item layanan berhasil dihapus' };
  }

  private async findOneOrFail(id: number) {
    const layanan = await this.prisma.layanan.findUnique({ where: { id } });
    if (!layanan) throw new NotFoundException('Kategori layanan tidak ditemukan');
    return layanan;
  }
}
