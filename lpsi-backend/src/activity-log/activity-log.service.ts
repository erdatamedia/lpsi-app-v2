import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  async log(requestId: number, action: string, keterangan: string) {
    try {
      await this.prisma.activityLog.create({ data: { requestId, action, keterangan } });
    } catch {}
  }

  async getByRequest(requestId: number) {
    return this.prisma.activityLog.findMany({
      where: { requestId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
