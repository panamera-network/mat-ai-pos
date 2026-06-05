// src/tables/tables.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { TablesService } from './tables.service';
import { TableStatus } from '@prisma/client';

@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  findAll() {
    return this.tablesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tablesService.findOne(id);
  }

  @Post()
  create(@Body() dto: { number: string; capacity?: number }) {
    return this.tablesService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<{ number: string; capacity: number; status: TableStatus }>) {
    return this.tablesService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: TableStatus) {
    return this.tablesService.updateStatus(id, status);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.tablesService.delete(id);
  }
}