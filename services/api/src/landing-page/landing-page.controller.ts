import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { LandingPageService } from './landing-page.service';
import { CreateLandingPageContentDto } from './dto/create-landing-page-content.dto';
import { UpdateLandingPageContentDto } from './dto/update-landing-page-content.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';


@Controller('landing-page')
export class LandingPageController {
  constructor(private readonly service: LandingPageService) {}

  @Get('public')
  async getPublic(@Query('outletId') outletId?: string) {
    return this.service.findPublic(outletId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query('outletId') outletId?: string) {
    return this.service.findAll(outletId);
  }

  @Get(':section')
  @UseGuards(JwtAuthGuard)
  async findBySection(
    @Param('section') section: string,
    @Query('outletId') outletId?: string,
  ) {
    return this.service.findBySection(section, outletId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateLandingPageContentDto) {
    return this.service.create(dto);
  }

  @Post('seed')
  @UseGuards(JwtAuthGuard)
  async seed(@Query('outletId') outletId?: string) {
    return this.service.seedDefault(outletId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLandingPageContentDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}