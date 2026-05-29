import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class InputBillingDto {
  @IsNotEmpty()
  @IsString()
  kodeBilling: string;

  @IsNumber()
  totalTagihan: number;
}
