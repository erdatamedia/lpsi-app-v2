import { Module } from '@nestjs/common';
import { LayananService } from './layanan.service';
import { LayananController } from './layanan.controller';

@Module({
  controllers: [LayananController],
  providers: [LayananService],
})
export class LayananModule {}
