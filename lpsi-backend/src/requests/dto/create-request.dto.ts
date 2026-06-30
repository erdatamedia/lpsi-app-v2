import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class CreateSampleDto {
  @IsNotEmpty()
  @IsString()
  kategori: string;

  @IsNotEmpty()
  @IsString()
  namaSampel: string;

  @IsOptional()
  @IsNumber()
  beratBasah?: number;

  @IsOptional()
  @IsNumber()
  beratKering?: number;

  @IsOptional()
  @IsString()
  kemasan?: string;

  @IsArray()
  jenisUji: string[];

  @IsNumber()
  hargaTotal: number;
}

export class CreateRequestDto {
  @IsNotEmpty()
  @IsString()
  namaPemohon: string;

  @IsNotEmpty()
  @IsString()
  alamat: string;

  @IsNotEmpty()
  @IsString()
  noHp: string;

  @IsEmail()
  emailPemohon: string;

  @IsDateString()
  tanggalPermohonan: string;

  @IsOptional()
  kirimLhpFisik?: boolean;

  @IsOptional()
  @IsString()
  alamatPengiriman?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSampleDto)
  samples: CreateSampleDto[];
}
