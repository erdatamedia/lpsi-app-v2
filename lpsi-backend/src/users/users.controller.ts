import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import type { UpdateProfileDto } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser() user: User) {
    return this.usersService.getProfile(user);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('admin/list')
  listUsers() {
    return this.usersService.listUsers();
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch('admin/:id/activate')
  toggleActivate(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.toggleActivate(id);
  }
}
