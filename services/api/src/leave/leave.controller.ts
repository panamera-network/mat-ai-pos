// src/leave/leave.controller.ts
import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { LeaveType } from '@prisma/client';

@Controller('leave')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  create(@Body() dto: {
    staffId: string;
    type: LeaveType;
    startDate: string;
    endDate: string;
    reason?: string;
  }) {
    return this.leaveService.create(dto);
  }

  @Get('my/:staffId')
  findByStaff(@Param('staffId') staffId: string) {
    return this.leaveService.findByStaff(staffId);
  }

  @Get('pending')
  findPending() {
    return this.leaveService.findPending();
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body('approvedBy') approvedBy: string) {
    return this.leaveService.approve(id, approvedBy);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body('approvedBy') approvedBy: string) {
    return this.leaveService.reject(id, approvedBy);
  }
}