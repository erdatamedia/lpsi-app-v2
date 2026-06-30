import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  getMetrics() {
    return this.dashboardService.getMetrics();
  }

  @Get('settings/:key')
  getSetting(@Param('key') key: string) {
    return this.dashboardService.getSetting(key);
  }

  @Patch('settings/:key')
  updateSetting(@Param('key') key: string, @Body('value') value: string) {
    return this.dashboardService.updateSetting(key, value);
  }

  @Get('skm-pertanyaan')
  getSkmPertanyaan() {
    return this.dashboardService.getSkmPertanyaan();
  }

  @Post('skm-pertanyaan')
  createSkmPertanyaan(@Body('label') label: string, @Body('urutan') urutan: number) {
    return this.dashboardService.createSkmPertanyaan(label, urutan ?? 0);
  }

  @Patch('skm-pertanyaan/:id')
  updateSkmPertanyaan(
    @Param('id', ParseIntPipe) id: number,
    @Body('label') label?: string,
    @Body('urutan') urutan?: number,
    @Body('isActive') isActive?: boolean,
  ) {
    return this.dashboardService.updateSkmPertanyaan(id, label, urutan, isActive);
  }

  @Delete('skm-pertanyaan/:id')
  deleteSkmPertanyaan(@Param('id', ParseIntPipe) id: number) {
    return this.dashboardService.deleteSkmPertanyaan(id);
  }

  @Get('export')
  async exportExcel(@Res() res: Response) {
    const buf = await this.dashboardService.exportExcel();
    const filename = `LPSI-Ekspor-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buf);
  }
}
