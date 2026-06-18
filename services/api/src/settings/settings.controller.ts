// src/settings/settings.controller.ts
import { Controller, Get, Post, Body, Param, Delete, Patch, Query } from '@nestjs/common';  // ← TAMBAH Query
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findAll(@Query('outletId') outletId?: string) {  // ← TAMBAH
    return this.settingsService.findAll(outletId);
  }

  @Get(':key')
  findOne(@Param('key') key: string, @Query('outletId') outletId?: string) {  // ← TAMBAH
    return this.settingsService.findOne(key, outletId);
  }

  @Post()
  upsert(@Body() dto: { key: string; value: string; description?: string; updatedBy?: string; outletId?: string }) {  // ← TAMBAH outletId
    return this.settingsService.upsert(dto.key, dto.value, dto.description, dto.updatedBy, dto.outletId);
  }

  @Patch(':key')
  update(
    @Param('key') key: string, 
    @Body() dto: { value: string; description?: string; updatedBy?: string; outletId?: string }  // ← TAMBAH outletId
  ) {
    return this.settingsService.upsert(key, dto.value, dto.description, dto.updatedBy, dto.outletId);
  }

  @Delete(':key')
  delete(@Param('key') key: string, @Query('outletId') outletId?: string) {  // ← TAMBAH
    return this.settingsService.delete(key, outletId);
  }
}