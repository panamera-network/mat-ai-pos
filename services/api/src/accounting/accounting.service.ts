import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountType, Prisma } from '@prisma/client';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { PostJournalEntryDto } from './dto/post-journal-entry.dto';
import { TrialBalanceQueryDto } from './dto/trial-balance-query.dto';
import { LedgerQueryDto } from './dto/ledger-query.dto';

@Injectable()
export class AccountingService {
  constructor(private readonly prisma: PrismaService) {}

  private amount(value: string | number | null | undefined): number {
    return Number(value || 0);
  }

  // ============================================
  // ACCOUNT CRUD
  // ============================================

  async createAccount(dto: CreateAccountDto) {
    // Check for duplicate code within outlet
    const existing = await this.prisma.account.findFirst({
      where: { code: dto.code, outletId: dto.outletId || null },
    });
    if (existing) {
      throw new BadRequestException(`Account code ${dto.code} already exists`);
    }

    return this.prisma.account.create({
      data: {
        code: dto.code,
        name: dto.name,
        type: dto.type,
        description: dto.description,
        parentId: dto.parentId,
        outletId: dto.outletId,
      },
    });
  }

  async findAllAccounts(outletId?: string) {
    return this.prisma.account.findMany({
      where: outletId ? { outletId } : {},
      include: { children: true, parent: true },
      orderBy: { code: 'asc' },
    });
  }

  async findAccountById(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: { children: true, parent: true, journalLines: true },
    });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async updateAccount(id: string, dto: UpdateAccountDto) {
    const account = await this.prisma.account.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');
    if (account.isPreset) {
      throw new BadRequestException('Cannot modify preset accounts');
    }

    return this.prisma.account.update({
      where: { id },
      data: dto as Prisma.AccountUpdateInput,
    });
  }

  async deleteAccount(id: string) {
    const account = await this.prisma.account.findUnique({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');
    if (account.isPreset) {
      throw new BadRequestException('Cannot delete preset accounts');
    }

    // Check if account has journal lines
    const linesCount = await this.prisma.journalLine.count({
      where: { accountId: id },
    });
    if (linesCount > 0) {
      throw new BadRequestException('Cannot delete account with journal entries');
    }

    return this.prisma.account.delete({ where: { id } });
  }

  // ============================================
  // PRESET COA GENERATION
  // ============================================

  async createPresetCoa(outletId: string) {
    const { PRESET_COA } = await import('./preset-coa');
    const created: string[] = [];

    // First pass: create parent accounts
    for (const acc of PRESET_COA.filter(a => !a.parentCode)) {
      const existing = await this.prisma.account.findFirst({
        where: { code: acc.code, outletId },
      });
      if (!existing) {
        await this.prisma.account.create({
          data: {
            code: acc.code,
            name: acc.name,
            type: acc.type as AccountType,
            description: acc.description,
            outletId,
            isPreset: true,
          },
        });
        created.push(acc.code);
      }
    }

    // Second pass: create child accounts with parent links
    for (const acc of PRESET_COA.filter(a => a.parentCode)) {
      const existing = await this.prisma.account.findFirst({
        where: { code: acc.code, outletId },
      });
      if (!existing) {
        const parent = await this.prisma.account.findFirst({
          where: { code: acc.parentCode, outletId },
        });
        await this.prisma.account.create({
          data: {
            code: acc.code,
            name: acc.name,
            type: acc.type as AccountType,
            description: acc.description,
            outletId,
            parentId: parent?.id,
            isPreset: true,
          },
        });
        created.push(acc.code);
      }
    }

    return { message: `Created ${created.length} preset accounts`, created };
  }

  // ============================================
  // JOURNAL ENTRY CRUD
  // ============================================

  async createJournalEntry(dto: CreateJournalEntryDto) {
    // Validate: total debits must equal total credits
    const totalDebits = dto.lines.reduce((sum, l) => sum + this.amount(l.debit), 0);
    const totalCredits = dto.lines.reduce((sum, l) => sum + this.amount(l.credit), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.001) {
      throw new BadRequestException('Total debits must equal total credits');
    }

    if (dto.lines.length < 2) {
      throw new BadRequestException('Journal entry must have at least 2 lines');
    }

    return this.prisma.journalEntry.create({
      data: {
        date: dto.date || new Date(),
        reference: dto.reference,
        description: dto.description,
        outletId: dto.outletId,
        createdById: dto.createdById,
        isAutoGenerated: dto.isAutoGenerated || false,
        lines: {
          create: dto.lines.map(line => ({
            accountId: line.accountId,
            description: line.description,
            debit: new Prisma.Decimal(line.debit || 0),
            credit: new Prisma.Decimal(line.credit || 0),
          })),
        },
      },
      include: { lines: { include: { account: true } } },
    });
  }

  async findAllJournalEntries(outletId?: string, from?: Date, to?: Date) {
    const where: Prisma.JournalEntryWhereInput = {};
    if (outletId) where.outletId = outletId;
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = from;
      if (to) where.date.lte = to;
    }

    return this.prisma.journalEntry.findMany({
      where,
      include: {
        lines: { include: { account: true } },
        order: true,
        payroll: true,
        receipt: true,
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findJournalEntryById(id: string) {
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id },
      include: {
        lines: { include: { account: true } },
        order: true,
        payroll: true,
        receipt: true,
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (!entry) throw new NotFoundException('Journal entry not found');
    return entry;
  }

  async postJournalEntry(dto: PostJournalEntryDto) {
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id: dto.id },
      include: { lines: true },
    });
    if (!entry) throw new NotFoundException('Journal entry not found');
    if (entry.isPosted) {
      throw new BadRequestException('Journal entry already posted');
    }

    return this.prisma.journalEntry.update({
      where: { id: dto.id },
      data: { isPosted: true, postedAt: new Date() },
      include: { lines: { include: { account: true } } },
    });
  }

  async deleteJournalEntry(id: string) {
    const entry = await this.prisma.journalEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Journal entry not found');
    if (entry.isPosted) {
      throw new BadRequestException('Cannot delete posted journal entry');
    }
    if (entry.isAutoGenerated) {
      throw new BadRequestException('Cannot delete auto-generated journal entry');
    }

    return this.prisma.journalEntry.delete({ where: { id } });
  }

  // ============================================
  // AUTO-JOURNAL GENERATION (Order Paid)
  // ============================================

  async createOrderJournal(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { menuItem: true } }, outlet: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'PAID') {
      throw new BadRequestException('Order must be PAID to generate journal entry');
    }

    // Check if journal already exists
    const existing = await this.prisma.journalEntry.findUnique({
      where: { orderId },
    });
    if (existing) {
      throw new BadRequestException('Journal entry already exists for this order');
    }

    const outletId = order.outletId;
    const totalAmount = order.totalAmount;
    const paymentMethod = order.paymentMethod || 'CASH';

    // Find accounts by code for this outlet
    const cashAccount = await this.getAccountByCode('1000', outletId);
    const bankAccount = await this.getAccountByCode('1010', outletId);
    const foodSalesAccount = await this.getAccountByCode('4000', outletId);
    const bevSalesAccount = await this.getAccountByCode('4010', outletId);
    const cogsFoodAccount = await this.getAccountByCode('5000', outletId);
    const cogsBevAccount = await this.getAccountByCode('5010', outletId);
    const inventoryRawAccount = await this.getAccountByCode('1100', outletId);

    const lines: { accountId: string; description?: string; debit?: string; credit?: string }[] = [];

    // 1. DEBIT: Cash/Bank (Asset increases)
    const debitAccount = paymentMethod === 'CASH' ? cashAccount : bankAccount;
    if (debitAccount) {
      lines.push({
        accountId: debitAccount.id,
        description: `Payment received - ${paymentMethod}`,
        debit: totalAmount.toString(),
      });
    }

    // 2. CREDIT: Sales Revenue (Revenue increases)
    // Split by food vs beverage based on menu item category
    let foodTotal = new Prisma.Decimal(0);
    let bevTotal = new Prisma.Decimal(0);
    let totalCogs = new Prisma.Decimal(0);

    for (const item of order.items) {
      const itemTotal = new Prisma.Decimal(item.totalPrice);
      // Simple heuristic: if menu item name contains "drink", "beverage", "coffee", "tea" → beverage
      const isBeverage = /drink|beverage|coffee|tea|juice|soda|water/i.test(item.name);
      if (isBeverage && bevSalesAccount) {
        bevTotal = bevTotal.add(itemTotal);
      } else if (foodSalesAccount) {
        foodTotal = foodTotal.add(itemTotal);
      }

      // Estimate COGS (30% of selling price as rough estimate)
      // In real implementation, this should come from recipe costing
      const estimatedCogs = itemTotal.mul(0.3);
      totalCogs = totalCogs.add(estimatedCogs);
    }

    if (foodTotal.gt(0) && foodSalesAccount) {
      lines.push({
        accountId: foodSalesAccount.id,
        description: 'Food sales revenue',
        credit: foodTotal.toString(),
      });
    }
    if (bevTotal.gt(0) && bevSalesAccount) {
      lines.push({
        accountId: bevSalesAccount.id,
        description: 'Beverage sales revenue',
        credit: bevTotal.toString(),
      });
    }

    // 3. COGS entry (if inventory tracking enabled)
    if (totalCogs.gt(0) && cogsFoodAccount && inventoryRawAccount) {
      lines.push(
        {
          accountId: cogsFoodAccount.id,
          description: 'Cost of goods sold',
          debit: totalCogs.toString(),
        },
        {
          accountId: inventoryRawAccount.id,
          description: 'Inventory used for order',
          credit: totalCogs.toString(),
        }
      );
    }

    // Validate balance
    const totalDebits = lines.reduce((sum, l) => sum + (parseFloat(l.debit || '0')), 0);
    const totalCredits = lines.reduce((sum, l) => sum + (parseFloat(l.credit || '0')), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.001) {
      // Fallback: single revenue line if split doesn't balance
      lines.length = 0;
      if (debitAccount) {
        lines.push({
          accountId: debitAccount.id,
          description: `Payment received - ${paymentMethod}`,
          debit: totalAmount.toString(),
        });
      }
      if (foodSalesAccount) {
        lines.push({
          accountId: foodSalesAccount.id,
          description: 'Sales revenue',
          credit: totalAmount.toString(),
        });
      }
    }

    return this.prisma.journalEntry.create({
      data: {
        date: new Date(),
        reference: order.orderNumber,
        description: `Auto-generated: Order ${order.orderNumber}`,
        outletId,
        orderId: order.id,
        isAutoGenerated: true,
        isPosted: true,
        postedAt: new Date(),
        lines: {
          create: lines.map(line => ({
            accountId: line.accountId,
            description: line.description,
            debit: new Prisma.Decimal(line.debit || 0),
            credit: new Prisma.Decimal(line.credit || 0),
          })),
        },
      },
      include: { lines: { include: { account: true } } },
    });
  }

  // ============================================
  // AUTO-JOURNAL: Payroll
  // ============================================

  async createPayrollJournal(payrollId: string) {
    const payroll = await this.prisma.payroll.findUnique({
      where: { id: payrollId },
      include: { staff: true },
    });
    if (!payroll) throw new NotFoundException('Payroll not found');
    if (payroll.status !== 'PAID') {
      throw new BadRequestException('Payroll must be PAID to generate journal entry');
    }

    const existing = await this.prisma.journalEntry.findUnique({
      where: { payrollId },
    });
    if (existing) {
      throw new BadRequestException('Journal entry already exists for this payroll');
    }

    const outletId = payroll.staff.outletId;
    const wagesAccount = await this.getAccountByCode('6000', outletId);
    const epfAccount = await this.getAccountByCode('6010', outletId);
    const socsoAccount = await this.getAccountByCode('6020', outletId);
    const cashAccount = await this.getAccountByCode('1000', outletId);
    const epfPayable = await this.getAccountByCode('2200', outletId);
    const socsoPayable = await this.getAccountByCode('2210', outletId);

    const lines: { accountId: string; description?: string; debit?: string; credit?: string }[] = [];

    // DEBIT: Wages expense
    if (wagesAccount) {
      lines.push({
        accountId: wagesAccount.id,
        description: `Wages - ${payroll.staff.name}`,
        debit: payroll.basicPay.toString(),
      });
    }

    // DEBIT: EPF employer contribution
    if (epfAccount && payroll.epfEmployer.gt(0)) {
      lines.push({
        accountId: epfAccount.id,
        description: `EPF employer - ${payroll.staff.name}`,
        debit: payroll.epfEmployer.toString(),
      });
    }

    // DEBIT: SOCSO employer contribution
    if (socsoAccount && payroll.socsoEmployer.gt(0)) {
      lines.push({
        accountId: socsoAccount.id,
        description: `SOCSO employer - ${payroll.staff.name}`,
        debit: payroll.socsoEmployer.toString(),
      });
    }

    // CREDIT: Cash (net pay)
    if (cashAccount) {
      lines.push({
        accountId: cashAccount.id,
        description: `Net pay to ${payroll.staff.name}`,
        credit: payroll.nettPay.toString(),
      });
    }

    // CREDIT: EPF payable (employee + employer)
    const totalEpf = payroll.epfEmployee.add(payroll.epfEmployer);
    if (epfPayable && totalEpf.gt(0)) {
      lines.push({
        accountId: epfPayable.id,
        description: `EPF payable - ${payroll.staff.name}`,
        credit: totalEpf.toString(),
      });
    }

    // CREDIT: SOCSO payable (employee + employer)
    const totalSocso = payroll.socsoEmployee.add(payroll.socsoEmployer);
    if (socsoPayable && totalSocso.gt(0)) {
      lines.push({
        accountId: socsoPayable.id,
        description: `SOCSO payable - ${payroll.staff.name}`,
        credit: totalSocso.toString(),
      });
    }

    return this.prisma.journalEntry.create({
      data: {
        date: payroll.paidAt || new Date(),
        reference: `PAY-${payroll.id.slice(0, 8)}`,
        description: `Auto-generated: Payroll for ${payroll.staff.name} (${payroll.periodStart.toISOString().slice(0, 10)} - ${payroll.periodEnd.toISOString().slice(0, 10)})`,
        outletId,
        payrollId: payroll.id,
        isAutoGenerated: true,
        isPosted: true,
        postedAt: new Date(),
        lines: {
          create: lines.map(line => ({
            accountId: line.accountId,
            description: line.description,
            debit: new Prisma.Decimal(line.debit || 0),
            credit: new Prisma.Decimal(line.credit || 0),
          })),
        },
      },
      include: { lines: { include: { account: true } } },
    });
  }

  // ============================================
  // REPORTS
  // ============================================

  async getTrialBalance(query: TrialBalanceQueryDto) {
    const { outletId, asOf } = query;
    const dateFilter = asOf ? { lte: asOf } : {};

    const accounts = await this.prisma.account.findMany({
      where: outletId ? { outletId } : {},
      include: {
        journalLines: {
          where: {
            journalEntry: {
              isPosted: true,
              date: dateFilter,
            },
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    let totalDebits = 0;
    let totalCredits = 0;

    const rows = accounts.map(acc => {
      const debits = acc.journalLines.reduce((sum, l) => sum + l.debit.toNumber(), 0);
      const credits = acc.journalLines.reduce((sum, l) => sum + l.credit.toNumber(), 0);

      let balance: number;
      if (['ASSET', 'EXPENSE'].includes(acc.type)) {
        balance = debits - credits;
      } else {
        balance = credits - debits;
      }

      totalDebits += debits;
      totalCredits += credits;

      return {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        debits,
        credits,
        balance,
      };
    }).filter(r => r.debits > 0 || r.credits > 0);

    return {
      asOf: asOf || new Date(),
      rows,
      totalDebits,
      totalCredits,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.001,
    };
  }

  async getGeneralLedger(query: LedgerQueryDto) {
    const { accountId, from, to } = query;

    const lines = await this.prisma.journalLine.findMany({
      where: {
        accountId,
        journalEntry: {
          isPosted: true,
          date: {
            ...(from && { gte: from }),
            ...(to && { lte: to }),
          },
        },
      },
      include: {
        journalEntry: {
          select: { date: true, reference: true, description: true },
        },
      },
      orderBy: { journalEntry: { date: 'asc' } },
    });

    const account = await this.prisma.account.findUnique({ where: { id: accountId } });
    let runningBalance = 0;

    const ledgerLines = lines.map(line => {
      const debit = line.debit.toNumber();
      const credit = line.credit.toNumber();

      if (['ASSET', 'EXPENSE'].includes(account?.type || '')) {
        runningBalance += debit - credit;
      } else {
        runningBalance += credit - debit;
      }

      return {
        date: line.journalEntry.date,
        reference: line.journalEntry.reference,
        description: line.description || line.journalEntry.description,
        debit,
        credit,
        balance: runningBalance,
      };
    });

    return {
      account: { code: account?.code, name: account?.name, type: account?.type },
      from: from || null,
      to: to || null,
      lines: ledgerLines,
      openingBalance: 0, // Can be enhanced to calculate from before 'from' date
      closingBalance: runningBalance,
    };
  }

  // ============================================
  // HELPERS
  // ============================================

  private async getAccountByCode(code: string, outletId?: string | null) {
    return this.prisma.account.findFirst({
      where: { code, outletId: outletId || null },
    });
  }
}
