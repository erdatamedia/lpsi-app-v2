import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  nama: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  jenisKelamin?: string;

  @IsOptional()
  tanggalLahir?: string;

  @IsOptional()
  @IsString()
  pekerjaan?: string;

  @IsOptional()
  @IsString()
  pendidikanTerakhir?: string;
}
