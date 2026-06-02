import { IsOptional, IsString, IsBoolean, IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSlideDto {
  @IsOptional() @IsString() caption?: string;
  @IsOptional() @IsInt() @Type(() => Number) urutan?: number;
  @IsOptional() @IsBoolean() @Type(() => Boolean) isActive?: boolean;
}

export class ReorderSlideDto {
  @IsInt() @Type(() => Number) urutan: number;
}

export enum CardMediaType {
  HARGA_LAYANAN = 'HARGA_LAYANAN',
  ALUR_LAYANAN = 'ALUR_LAYANAN',
  DOKUMEN_ISO = 'DOKUMEN_ISO',
}

export class UpsertCardMediaDto {
  @IsEnum(CardMediaType) type: CardMediaType;
}
