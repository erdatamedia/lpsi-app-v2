import { Body, Controller, Get, Param, ParseIntPipe, Patch, Res, UseGuards } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { join } from 'path';
import type { Response } from 'express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/requests')
export class AnalysisController {
  constructor(
    private readonly analysisService: AnalysisService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  findAll() {
    return this.analysisService.findAll();
  }

  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStatusDto) {
    return this.analysisService.updateStatus(id, dto.status);
  }

  @Patch(':id/resi-lhp')
  inputResiLhp(
    @Param('id', ParseIntPipe) id: number,
    @Body('resiLhp') resiLhp: string,
  ) {
    return this.analysisService.inputResiLhp(id, resiLhp);
  }

  @Get(':id/surat-pengantar')
  async downloadSuratPengantar(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const request = await this.prisma.labRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Permohonan tidak ditemukan');
    if (!request.suratPengantar) throw new NotFoundException('Surat pengantar tidak tersedia');
    const uploadDir = this.config.get<string>('UPLOAD_DIR') ?? './uploads';
    const filename = `surat-pengantar-${request.nomorPermohonan}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    const root = uploadDir.startsWith('/') ? uploadDir : join(process.cwd(), uploadDir);
    return res.sendFile(request.suratPengantar, { root });
  }
}
