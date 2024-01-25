import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard, UserGuard, OwnerGuard, AdminGuard } from '../auth/guards';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getUsers() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('online')
  getUsersOnline() {
    return this.usersService.getUsersOnline();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user: User = await this.usersService.findOneById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('friends/:id')
  getUserFriends(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUsersFriends(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('blocked/:id')
  getBlockedUsers(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getBlockedUsers(id);
  }

  @UseGuards(JwtAuthGuard, UserGuard)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard, OwnerGuard)
  @Patch('role/:id')
  updateRole(@Param('id', ParseIntPipe) id: number, @Body() newRole: UpdateUserRoleDto) {
    return this.usersService.updateRole(id, newRole);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/ban')
  banUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.banFromWebsite(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/unban')
  unbanUser(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.unbanFromWebsite(id);
  }

}
