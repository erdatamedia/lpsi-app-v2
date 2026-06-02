import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [NotificationsModule, ActivityLogModule],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
