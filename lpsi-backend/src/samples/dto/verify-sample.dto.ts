import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SampleStatus } from '@prisma/client';

export class VerifySampleDto {
  @IsEnum(SampleStatus)
  status: SampleStatus;

  @IsOptional()
  @IsString()
  alasanTolak?: string;
}
