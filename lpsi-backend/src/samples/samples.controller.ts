import { Body, Controller, Param, ParseIntPipe, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { SamplesService } from './samples.service';
import { VerifySampleDto } from './dto/verify-sample.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/samples')
export class SamplesController {
  constructor(private readonly samplesService: SamplesService) {}

  @Patch(':id/verify')
  verify(@Param('id', ParseIntPipe) id: number, @Body() dto: VerifySampleDto) {
    return this.samplesService.verify(id, dto);
  }

  @Post(':id/lhp')
  @UseInterceptors(
    FileInterceptor('lhp', {
      storage: diskStorage({
        destination: process.env.UPLOAD_DIR ?? './uploads',
        filename: (_req, file, cb) => cb(null, `${uuidv4()}${extname(file.originalname)}`),
      }),
    }),
  )
  uploadLhp(@Param('id', ParseIntPipe) id: number, @UploadedFile() file: Express.Multer.File) {
    return this.samplesService.uploadLhp(id, file.filename);
  }
}
