import {
  Body, Controller, Delete, Get, Param, ParseIntPipe,
  Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ContentService } from './content.service';
import { UpdateSlideDto, CardMediaType } from './dto/content.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

const imageStorage = diskStorage({
  destination: process.env.UPLOAD_DIR ?? './uploads',
  filename: (_, file, cb) => cb(null, `${uuidv4()}${extname(file.originalname)}`),
});

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('slides')
  getSlides(@Query('all') all?: string) {
    return this.contentService.getSlides(all !== 'true');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('slides')
  @UseInterceptors(FileInterceptor('image', { storage: imageStorage }))
  createSlide(@UploadedFile() file: Express.Multer.File, @Body('caption') caption?: string) {
    return this.contentService.createSlide(file.filename, caption);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('slides/:id')
  updateSlide(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSlideDto) {
    return this.contentService.updateSlide(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('slides/:id')
  deleteSlide(@Param('id', ParseIntPipe) id: number) {
    return this.contentService.deleteSlide(id);
  }

  @Get('card-media')
  getCardMedia() {
    return this.contentService.getCardMedia();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('card-media/:type')
  @UseInterceptors(FileInterceptor('file', { storage: imageStorage }))
  upsertCardMedia(
    @Param('type') type: CardMediaType,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.contentService.upsertCardMedia(type, file.filename);
  }
}
