import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private mailer: MailerService,
  ) {}

  async create(userId: number, type: string, message: string) {
    return this.prisma.notification.create({ data: { userId, type, message } });
  }

  async sendWithEmail(
    userId: number,
    type: string,
    message: string,
    email: string,
    subject: string,
    template: string,
    context: Record<string, unknown>,
  ) {
    try {
      await Promise.all([
        this.create(userId, type, message),
        this.mailer.sendMail({ to: email, subject, template, context }),
      ]);
    } catch {}
  }

  async findAll(userId: number) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return { statusCode: 200, message: 'Notifikasi berhasil diambil', data: notifications };
  }

  async markRead(id: number, userId: number) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    return { statusCode: 200, message: 'Notifikasi ditandai dibaca' };
  }

  async markAllRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { statusCode: 200, message: 'Semua notifikasi ditandai dibaca' };
  }
}
