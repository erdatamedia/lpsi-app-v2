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
    const token = uuidv4();

    const user = await this.prisma.user.create({
      data: {
        nama: dto.nama,
        email: dto.email,
        password: hash,
        jenisKelamin: dto.jenisKelamin,
        tanggalLahir: dto.tanggalLahir ? new Date(dto.tanggalLahir) : undefined,
        activateToken: token,
      },
    });

    const activationUrl = `${this.config.get('APP_URL')}/aktivasi?token=${token}`;
    try {
      await this.mailer.sendMail({
        to: user.email,
        subject: 'Aktivasi Akun LPSI',
        template: 'activation',
        context: { nama: user.nama, activationUrl },
      });
    } catch {}

    return { statusCode: 201, message: 'Registrasi berhasil. Cek email untuk aktivasi akun.' };
  }

  async activate(token: string) {
    const user = await this.prisma.user.findFirst({ where: { activateToken: token } });
    if (!user) throw new BadRequestException('Token aktivasi tidak valid');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isActive: true, activateToken: null },
    });

    return { statusCode: 200, message: 'Akun berhasil diaktivasi. Silakan login.' };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Email atau password salah');
    if (!user.isActive) throw new UnauthorizedException('Akun belum diaktivasi');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Email atau password salah');

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwt.sign(payload);

    return { token, user: { id: user.id, nama: user.nama, email: user.email, role: user.role } };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('Email tidak ditemukan');

    const token = uuidv4();
    await this.prisma.user.update({ where: { id: user.id }, data: { resetToken: token } });

    const resetUrl = `${this.config.get('APP_URL')}/reset-password?token=${token}`;
    try {
      await this.mailer.sendMail({
        to: user.email,
        subject: 'Reset Password LPSI',
        template: 'reset-password',
        context: { nama: user.nama, resetUrl },
      });
    } catch {}

    return { statusCode: 200, message: 'Link reset password telah dikirim ke email Anda.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({ where: { resetToken: dto.token } });
    if (!user) throw new BadRequestException('Token reset password tidak valid');

    const hash = await bcrypt.hash(dto.password, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hash, resetToken: null },
    });

    return { statusCode: 200, message: 'Password berhasil direset. Silakan login.' };
  }
}
