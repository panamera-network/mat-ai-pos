import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

@Controller('promotions')
export class PromotionController {
  constructor(private readonly service: PromotionService) {}

  @Post()
  create(@Body() dto: CreatePromotionDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('outletId') outletId?: string,
    @Query('active') active?: string,
  ) {
    return this.service.findAll(outletId, active === 'true');
  }

  @Get('active/:outletId')
  findActive(
    @Param('outletId') outletId: string,
    @Query('customerType') customerType?: string,
  ) {
    return this.service.findActive(outletId, customerType);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
