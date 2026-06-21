import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { RoleService } from './role.service';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }

  @Post()
  create(@Body() data: { name: string; permissions: Record<string, boolean>; isActive?: boolean }) {
    return this.roleService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: { name?: string; permissions?: Record<string, boolean>; isActive?: boolean }) {
    return this.roleService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.roleService.delete(id);
  }
}