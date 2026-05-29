import { IsString, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';

export class CreateLayananDto {
  @IsString() @IsNotEmpty() kategori: string;
  @IsInt() @IsOptional() @Min(0) urutan?: number;
}

export class UpdateLayananDto {
  @IsString() @IsOptional() kategori?: string;
  @IsInt() @IsOptional() @Min(0) urutan?: number;
}

export class CreateLayananItemDto {
  @IsString() @IsNotEmpty() nama: string;
  @IsInt() @IsOptional() @Min(0) urutan?: number;
}

export class UpdateLayananItemDto {
  @IsString() @IsOptional() nama?: string;
  @IsInt() @IsOptional() @Min(0) urutan?: number;
}
