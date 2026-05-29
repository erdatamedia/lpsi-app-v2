import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { LayananService } from './layanan.service';
import { CreateLayananDto, UpdateLayananDto, CreateLayananItemDto, UpdateLayananItemDto } from './dto/layanan.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('layanan')
export class LayananController {
  constructor(private readonly layananService: LayananService) {}

  @Get()
  findAll() {
    return this.layananService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateLayananDto) {
    return this.layananService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLayananDto) {
    return this.layananService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.layananService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/items')
  createItem(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateLayananItemDto) {
    return this.layananService.createItem(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('items/:itemId')
  updateItem(@Param('itemId', ParseIntPipe) itemId: number, @Body() dto: UpdateLayananItemDto) {
    return this.layananService.updateItem(itemId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('items/:itemId')
  removeItem(@Param('itemId', ParseIntPipe) itemId: number) {
    return this.layananService.removeItem(itemId);
  }
}
