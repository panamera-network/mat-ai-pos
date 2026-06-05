// src/settings/settings.controller.ts
import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.settingsService.findOne(key);
  }

  @Post()
  upsert(@Body() dto: { key: string; value: string; description?: string; updatedBy?: string }) {
    return this.settingsService.upsert(dto.key, dto.value, dto.description, dto.updatedBy);
  }

  @Patch(':key')
  update(@Param('key') key: string, @Body() dto: { value: string; description?: string; updatedBy?: string }) {
    return this.settingsService.upsert(key, dto.value, dto.description, dto.updatedBy);
  }

  @Delete(':key')
  delete(@Param('key') key: string) {
    return this.settingsService.delete(key);
  }
}