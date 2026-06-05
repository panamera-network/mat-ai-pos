// src/staff/staff.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { StaffService } from './staff.service';
import { Role, EmploymentType } from '@prisma/client';

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  findAll() {
    return this.staffService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.staffService.findOne(id);
  }

  @Post()
  create(@Body() dto: {
    name: string;
    pin: string;
    role?: Role;
    employmentType?: EmploymentType;
    hourlyRate?: number;
    monthlySalary?: number;
  }) {
    return this.staffService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<{
    name: string;
    pin: string;
    role: Role;
    employmentType: EmploymentType;
    hourlyRate: number;
    monthlySalary: number;
    isActive: boolean;
  }>) {
    return this.staffService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.staffService.delete(id);
  }
}