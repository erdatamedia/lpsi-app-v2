import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class InputBillingDto {
  @IsNotEmpty()
  @IsString()
  kodeBilling: string;

  @Type(() => Number)
  @IsNumber()
  totalTagihan: number;
}
