// src/timecard/timecard.controller.ts
import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { TimecardService } from './timecard.service';

@Controller('timecard')
export class TimecardController {
  constructor(private readonly timecardService: TimecardService) {}

  @Post('clock-in')
  clockIn(@Body('staffId') staffId: string) {
    return this.timecardService.clockIn(staffId);
  }

  @Post('clock-out')
  clockOut(@Body('staffId') staffId: string) {
    return this.timecardService.clockOut(staffId);
  }

  @Get('my/:staffId')
  findByStaff(
    @Param('staffId') staffId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.timecardService.findByStaff(staffId, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Post(':id/verify')
  verify(@Param('id') id: string, @Body('verifiedBy') verifiedBy: string) {
    return this.timecardService.verify(id, verifiedBy);
  }

  @Get('weekly/:staffId')
  getWeeklyHours(
    @Param('staffId') staffId: string,
    @Query('weekStart') weekStart: string,
  ) {
    return this.timecardService.getWeeklyHours(staffId, new Date(weekStart));
  }

  @Get()
  findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.timecardService.findAll({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

}