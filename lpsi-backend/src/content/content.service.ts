import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSlideDto, CardMediaType } from './dto/content.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async getSlides(activeOnly = false) {
    const data = await this.prisma.slide.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { urutan: 'asc' },
    });
    return { statusCode: 200, message: 'Daftar slide berhasil diambil', data };
  }

  async createSlide(filename: string, caption?: string) {
    const count = await this.prisma.slide.count();
    const imageUrl = `/uploads/${filename}`;
    const data = await this.prisma.slide.create({
      data: { imageUrl, caption, urutan: count + 1 },
    });
    return { statusCode: 201, message: 'Slide berhasil ditambahkan', data };
  }

  async updateSlide(id: number, dto: UpdateSlideDto) {
    await this.findSlideOrFail(id);
    const data = await this.prisma.slide.update({ where: { id }, data: dto });
    return { statusCode: 200, message: 'Slide berhasil diperbarui', data };
  }

  async deleteSlide(id: number) {
    const slide = await this.findSlideOrFail(id);
    const filename = slide.imageUrl.replace('/uploads/', '');
    const filePath = path.join(process.env.UPLOAD_DIR ?? './uploads', filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await this.prisma.slide.delete({ where: { id } });
    return { statusCode: 200, message: 'Slide berhasil dihapus' };
  }

  async getCardMedia() {
    const data = await this.prisma.cardMedia.findMany();
    return { statusCode: 200, message: 'Card media berhasil diambil', data };
  }

  async upsertCardMedia(type: CardMediaType, filename: string) {
    const existing = await this.prisma.cardMedia.findUnique({ where: { type } });
    if (existing) {
      const oldFile = path.join(process.env.UPLOAD_DIR ?? './uploads', existing.fileUrl.replace('/uploads/', ''));
      if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
    }
    const fileUrl = `/uploads/${filename}`;
    const data = await this.prisma.cardMedia.upsert({
      where: { type },
      update: { fileUrl },
      create: { type, fileUrl },
    });
    return { statusCode: 200, message: 'Card media berhasil diperbarui', data };
  }

  private async findSlideOrFail(id: number) {
    const slide = await this.prisma.slide.findUnique({ where: { id } });
    if (!slide) throw new NotFoundException('Slide tidak ditemukan');
    return slide;
  }
}
