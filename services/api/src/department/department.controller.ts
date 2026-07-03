import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@Controller('departments')
@UseGuards(JwtAuthGuard)
export class DepartmentController {
  constructor(private readonly deptService: DepartmentService) {}

  @Get()
  findAll() {
    return this.deptService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deptService.findOne(id);
  }

  @Post()
  create(@Body() data: { name: string }) {
    return this.deptService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: { name?: string; isActive?: boolean }) {
    return this.deptService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deptService.remove(id);
  }
}
