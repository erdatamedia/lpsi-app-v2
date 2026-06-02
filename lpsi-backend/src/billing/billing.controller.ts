import {
  Body, Controller, Get, Param, ParseIntPipe,
  Patch, Post, Res, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Response } from 'express';
import { BillingService } from './billing.service';
import { InputBillingDto } from './dto/input-billing.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const fileStorage = diskStorage({
  destination: process.env.UPLOAD_DIR ?? './uploads',
  filename: (_, file, cb) => cb(null, `${uuidv4()}${extname(file.originalname)}`),
});

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/requests')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Post(':id/billing')
  @UseInterceptors(FileInterceptor('eBillingFile', { storage: fileStorage }))
  inputBilling(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: InputBillingDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.billingService.inputBilling(id, dto.kodeBilling, dto.totalTagihan, file?.filename);
  }

  // Tetap support PATCH untuk backward compat (update billing)
  @Patch(':id/billing')
  @UseInterceptors(FileInterceptor('eBillingFile', { storage: fileStorage }))
  updateBilling(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: InputBillingDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.billingService.inputBilling(id, dto.kodeBilling, dto.totalTagihan, file?.filename);
  }

  @Patch(':id/konfirmasi-bayar')
  konfirmasiBayar(@Param('id', ParseIntPipe) id: number) {
    return this.billingService.konfirmasiBayar(id);
  }

  // Download e-billing PDF (admin)
  @Get(':id/ebilling')
  async downloadEbilling(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const req = await this.prisma.labRequest.findUnique({ where: { id } });
    if (!req || !req.eBillingFile) throw new NotFoundException('File e-billing tidak ditemukan');
    const uploadDir = this.config.get<string>('UPLOAD_DIR') ?? './uploads';
    return res.sendFile(req.eBillingFile, { root: join(process.cwd(), uploadDir) });
  }

  // Download bukti bayar pemohon (admin)
  @Get(':id/bukti-bayar')
  async downloadBuktiBayar(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const req = await this.prisma.labRequest.findUnique({ where: { id } });
    if (!req || !req.buktiBayar) throw new NotFoundException('Bukti bayar tidak ditemukan');
    const uploadDir = this.config.get<string>('UPLOAD_DIR') ?? './uploads';
    return res.sendFile(req.buktiBayar, { root: join(process.cwd(), uploadDir) });
  }
}
