import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { OutletService } from './outlet.service';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';

@Controller('outlets')
export class OutletController {
  constructor(private readonly outletService: OutletService) {}

  @Post()
  create(@Body() dto: CreateOutletDto) {
    return this.outletService.create(dto);
  }

  @Get()
  findAll() {
    return this.outletService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.outletService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOutletDto) {
    return this.outletService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.outletService.remove(id);
  }
}