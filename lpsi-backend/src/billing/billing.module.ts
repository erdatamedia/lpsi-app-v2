import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [NotificationsModule, PrismaModule, ActivityLogModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
