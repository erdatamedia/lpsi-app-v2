import {
  Controller, Get, Param, ParseIntPipe,
  Patch, Post, Res, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Response } from 'express';
import { BillingService } from './billing.service';
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
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.billingService.inputBilling(id, file?.filename);
  }

  @Patch(':id/billing')
  @UseInterceptors(FileInterceptor('eBillingFile', { storage: fileStorage }))
  updateBilling(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.billingService.inputBilling(id, file?.filename);
  }

  @Patch(':id/konfirmasi-bayar')
  konfirmasiBayar(@Param('id', ParseIntPipe) id: number) {
    return this.billingService.konfirmasiBayar(id);
  }

  @Get(':id/ebilling')
  async downloadEbilling(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const req = await this.prisma.labRequest.findUnique({ where: { id } });
    if (!req || !req.eBillingFile) throw new NotFoundException('File e-billing tidak ditemukan');
    const uploadDir = this.config.get<string>('UPLOAD_DIR') ?? './uploads';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="ebilling-${req.nomorPermohonan}.pdf"`);
    return res.sendFile(req.eBillingFile, { root: join(process.cwd(), uploadDir) });
  }

  @Get(':id/bukti-bayar')
  async downloadBuktiBayar(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const req = await this.prisma.labRequest.findUnique({ where: { id } });
    if (!req || !req.buktiBayar) throw new NotFoundException('Bukti bayar tidak ditemukan');
    const uploadDir = this.config.get<string>('UPLOAD_DIR') ?? './uploads';
    res.setHeader('Content-Disposition', `inline; filename="buktibayar-${req.nomorPermohonan}"`);
    return res.sendFile(req.buktiBayar, { root: join(process.cwd(), uploadDir) });
  }
}
