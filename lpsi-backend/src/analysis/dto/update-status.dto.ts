import { IsEnum } from 'class-validator';
import { RequestStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(RequestStatus)
  status: RequestStatus;
}
