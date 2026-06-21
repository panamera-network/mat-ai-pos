// src/modifier/modifier.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ModifierService } from './modifier.service';
import { CreateModifierDto } from './dto/create-modifier.dto';
import { UpdateModifierDto } from './dto/update-modifier.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';


@Controller('modifiers')
export class ModifierController {
  constructor(private readonly modifierService: ModifierService) {}

  @Get()
  async findAll(@Query('outletId') outletId?: string) {
    return this.modifierService.findAll(outletId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.modifierService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateModifierDto) {
    return this.modifierService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateModifierDto) {
    return this.modifierService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return this.modifierService.remove(id);
  }
}