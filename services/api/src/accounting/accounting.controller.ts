import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { PermissionGuard } from '../auth/guard/permission.guard';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { PostJournalEntryDto } from './dto/post-journal-entry.dto';
import { TrialBalanceQueryDto } from './dto/trial-balance-query.dto';
import { LedgerQueryDto } from './dto/ledger-query.dto';

@Controller('accounting')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  // ============================================
  // ACCOUNTS
  // ============================================

  @Post('accounts')
  createAccount(@Body() dto: CreateAccountDto) {
    return this.accountingService.createAccount(dto);
  }

  @Get('accounts')
  findAllAccounts(@Query('outletId') outletId?: string) {
    return this.accountingService.findAllAccounts(outletId);
  }

  @Get('accounts/:id')
  findAccountById(@Param('id') id: string) {
    return this.accountingService.findAccountById(id);
  }

  @Patch('accounts/:id')
  updateAccount(@Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.accountingService.updateAccount(id, dto);
  }

  @Delete('accounts/:id')
  deleteAccount(@Param('id') id: string) {
    return this.accountingService.deleteAccount(id);
  }

  @Post('accounts/preset/:outletId')
  createPresetCoa(@Param('outletId') outletId: string) {
    return this.accountingService.createPresetCoa(outletId);
  }

  // ============================================
  // JOURNAL ENTRIES
  // ============================================

  @Post('journal-entries')
  createJournalEntry(@Body() dto: CreateJournalEntryDto) {
    return this.accountingService.createJournalEntry(dto);
  }

  @Get('journal-entries')
  findAllJournalEntries(
    @Query('outletId') outletId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.accountingService.findAllJournalEntries(
      outletId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('journal-entries/:id')
  findJournalEntryById(@Param('id') id: string) {
    return this.accountingService.findJournalEntryById(id);
  }

  @Post('journal-entries/:id/post')
  postJournalEntry(@Param('id') id: string) {
    return this.accountingService.postJournalEntry({ id });
  }

  @Delete('journal-entries/:id')
  deleteJournalEntry(@Param('id') id: string) {
    return this.accountingService.deleteJournalEntry(id);
  }

  // ============================================
  // AUTO-JOURNAL TRIGGERS
  // ============================================

  @Post('journal-entries/order/:orderId')
  createOrderJournal(@Param('orderId') orderId: string) {
    return this.accountingService.createOrderJournal(orderId);
  }

  @Post('journal-entries/payroll/:payrollId')
  createPayrollJournal(@Param('payrollId') payrollId: string) {
    return this.accountingService.createPayrollJournal(payrollId);
  }

  // ============================================
  // REPORTS
  // ============================================

  @Get('reports/trial-balance')
  getTrialBalance(@Query() query: TrialBalanceQueryDto) {
    return this.accountingService.getTrialBalance(query);
  }

  @Get('reports/general-ledger')
  getGeneralLedger(@Query() query: LedgerQueryDto) {
    return this.accountingService.getGeneralLedger(query);
  }
}
