import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Response } from 'express';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('requests')
export class RequestsController {
  constructor(
    private readonly requestsService: RequestsService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Roles('PEMOHON')
  @Get()
  findAll(@CurrentUser() user: User) {
    return this.requestsService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.requestsService.findOne(id, user);
  }

  @Roles('PEMOHON')
  @Post()
  @UseInterceptors(
    FileInterceptor('suratPengantar', {
      storage: diskStorage({
        destination: process.env.UPLOAD_DIR ?? './uploads',
        filename: (_req, file, cb) => cb(null, `${uuidv4()}${extname(file.originalname)}`),
      }),
    }),
  )
  create(
    @Body() body: Record<string, string>,
    @CurrentUser() user: User,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // samples dikirim sebagai JSON string dari FormData
    const dto: CreateRequestDto = {
      ...body,
      samples: typeof body.samples === 'string' ? JSON.parse(body.samples) : body.samples,
    } as CreateRequestDto;
    return this.requestsService.create(dto, user, file?.filename);
  }

  @Roles('PEMOHON')
  @Post(':id/bukti-bayar')
  @UseInterceptors(
    FileInterceptor('buktiBayar', {
      storage: diskStorage({
        destination: process.env.UPLOAD_DIR ?? './uploads',
        filename: (_req, file, cb) => cb(null, `${uuidv4()}${extname(file.originalname)}`),
      }),
    }),
  )
  uploadBuktiBayar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.requestsService.uploadBuktiBayar(id, user, file.filename);
  }

  @Roles('PEMOHON')
  @Patch(':id/kirim-lhp')
  setKirimLhp(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body('kirim') kirim: boolean,
  ) {
    return this.requestsService.setKirimLhpFisik(id, user, kirim);
  }

  @Roles('PEMOHON')
  @Post(':id/ikm')
  submitIkm(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Body() body: object,
  ) {
    return this.requestsService.submitIkm(id, user, body);
  }

  @Get(':id/logs')
  getLogs(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
    return this.requestsService.getLogs(id, user);
  }

  @Roles('PEMOHON')
  @Get(':id/ebilling')
  async downloadEbilling(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const request = await this.prisma.labRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Permohonan tidak ditemukan');
    if (request.userId !== user.id) throw new ForbiddenException('Akses ditolak');
    if (!request.eBillingFile) throw new NotFoundException('File e-billing belum tersedia');
    const uploadDir = this.config.get<string>('UPLOAD_DIR') ?? './uploads';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="ebilling-${request.nomorPermohonan}.pdf"`);
    return res.sendFile(request.eBillingFile, { root: join(process.cwd(), uploadDir) });
  }

  @Roles('PEMOHON')
  @Get(':id/lhp/:sampleId')
  async downloadLhp(
    @Param('id', ParseIntPipe) id: number,
    @Param('sampleId', ParseIntPipe) sampleId: number,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const request = await this.prisma.labRequest.findUnique({
      where: { id },
      include: { ikm: true, samples: true },
    });
    if (!request) throw new NotFoundException('Permohonan tidak ditemukan');
    if (request.userId !== user.id) throw new ForbiddenException('Akses ditolak');
    if (!request.ikm) throw new BadRequestException('Harap isi IKM terlebih dahulu');

    const sample = request.samples.find((s) => s.id === sampleId);
    if (!sample || !sample.lhpFile) throw new NotFoundException('File LHP tidak ditemukan');

    const uploadDir = this.config.get<string>('UPLOAD_DIR') ?? './uploads';
    return res.sendFile(sample.lhpFile, { root: join(process.cwd(), uploadDir) });
  }
}
