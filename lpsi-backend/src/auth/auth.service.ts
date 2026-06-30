import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mailer: MailerService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('Email sudah terdaftar');

    const hash = await bcrypt.hash(dto.password, 12);

    await this.prisma.user.create({
      data: {
        nama: dto.nama,
        email: dto.email,
        password: hash,
        jenisKelamin: dto.jenisKelamin,
        tanggalLahir: dto.tanggalLahir ? new Date(dto.tanggalLahir) : undefined,
        pekerjaan: dto.pekerjaan,
        pendidikanTerakhir: dto.pendidikanTerakhir,
        // isActive: false by default — aktivasi manual oleh admin
      },
    });

    return {
      statusCode: 201,
      message: 'Registrasi berhasil. Akun Anda sedang menunggu verifikasi oleh admin. Harap menunggu maksimal 1x24 jam.',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Email atau password salah');
    if (!user.isActive)
      throw new UnauthorizedException('Akun belum diaktivasi. Harap menunggu verifikasi admin.');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Email atau password salah');

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwt.sign(payload);

    return { token, user: { id: user.id, nama: user.nama, email: user.email, role: user.role } };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('Email tidak ditemukan');
    if (!user.isActive) throw new BadRequestException('Akun belum aktif');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetRequested: true, resetToken: null },
    });

    return {
      statusCode: 200,
      message: 'Permintaan reset password telah dikirim. Silakan hubungi admin dan kembali ke halaman ini untuk mengecek status persetujuan.',
    };
  }

  async checkResetStatus(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('Email tidak ditemukan');

    if (user.resetToken) {
      return { statusCode: 200, data: { status: 'APPROVED', token: user.resetToken } };
    }
    if (user.resetRequested) {
      return { statusCode: 200, data: { status: 'PENDING' } };
    }
    return { statusCode: 200, data: { status: 'NONE' } };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({ where: { resetToken: dto.token } });
    if (!user) throw new BadRequestException('Token reset password tidak valid atau sudah digunakan');

    const hash = await bcrypt.hash(dto.password, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hash, resetToken: null, resetRequested: false },
    });

    return { statusCode: 200, message: 'Password berhasil direset. Silakan login.' };
  }
}
