import { Body, Controller, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { InputBillingDto } from './dto/input-billing.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/requests')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Patch(':id/billing')
  inputBilling(@Param('id', ParseIntPipe) id: number, @Body() dto: InputBillingDto) {
    return this.billingService.inputBilling(id, dto.kodeBilling, dto.totalTagihan);
  }

  @Patch(':id/konfirmasi-bayar')
  konfirmasiBayar(@Param('id', ParseIntPipe) id: number) {
    return this.billingService.konfirmasiBayar(id);
  }
}
