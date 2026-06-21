import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

function readCSV(filename: string): any[] {
  const filePath = path.join(__dirname, 'csv', filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    cast: (value, context) => {
      if (context.column === 'quantity' || context.column === 'pax' || context.column === 'breakMinutes' || context.column === 'totalMinutes') {
        return parseInt(value) || undefined;
      }
      if (context.column === 'unitPrice' || context.column === 'totalPrice' || context.column === 'totalAmount' || context.column === 'paidAmount' || context.column === 'change' || context.column === 'taxAmount' || context.column === 'totalHours') {
        return parseFloat(value) || undefined;
      }
      if (context.column === 'createdAt' || context.column === 'clockIn' || context.column === 'clockOut') {
        return value ? new Date(value) : null;
      }
      return value || undefined;
    },
  });
}

async function seedOrders() {
  console.log('📝 Seeding orders...');
  const orders = readCSV('orders.csv');
  const orderItems = readCSV('order-items.csv');

  const menuItems = await prisma.menuItem.findMany({ select: { id: true, name: true } });
  const menuItemMap = new Map(menuItems.map(m => [m.name, m.id]));

  const diningTables = await prisma.diningTable.findMany({ select: { id: true, number: true } });
  const tableMap = new Map(diningTables.map(t => [t.number, t.id]));

  // Debug: check item names
  const csvItemNames = new Set(orderItems.map((oi: any) => oi.name));
  const dbItemNames = new Set(menuItems.map(m => m.name));
  const missing = [...csvItemNames].filter(name => !dbItemNames.has(name));
  if (missing.length > 0) {
    console.log('⚠️ Items in CSV but not in DB:', missing);
  }

  for (const order of orders) {
    // Skip duplicate
    const existing = await prisma.order.findUnique({
      where: { orderNumber: order.orderNumber },
    });
    if (existing) {
      console.log(`⏭️ Skipping ${order.orderNumber} — already exists`);
      continue;
    }

    const tableNumber = order.tableId;
    const tableId = tableMap.get(tableNumber);

    const createdOrder = await prisma.order.create({
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        source: order.source,
        type: order.type,
        totalAmount: order.totalAmount,
        paidAmount: order.paidAmount,
        taxAmount: order.taxAmount,
        paymentMethod: order.paymentMethod,
        customerName: order.customerName,
        tableId: tableId,
        pax: order.pax,
        notes: order.notes,
        createdAt: order.createdAt,
        outletId: order.outletId,  // ← Now matches DB: outlet-hq / outlet-pj
      },
    });

    const items = orderItems.filter((oi: any) => oi.orderNumber === order.orderNumber);
    for (const item of items) {
      const menuItemId = menuItemMap.get(item.name);
      if (!menuItemId) {
        console.warn(`⚠️ Skipping "${item.name}" — not in DB`);
        continue;
      }
      
      await prisma.orderItem.create({
        data: {
          orderId: createdOrder.id,
          menuItemId: menuItemId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        },
      });
    }
  }
  console.log(`✅ Seeded ${orders.length} orders`);
}

async function seedReceipts() {
  console.log('🧾 Seeding receipts...');
  const receipts = readCSV('receipts.csv');

  const orders = await prisma.order.findMany({ 
    include: { items: true },
  });
  const orderMap = new Map(orders.map(o => [o.orderNumber, o]));

  // Fetch staff — map by name atau guna first few staff
  const staffList = await prisma.staff.findMany({ 
    select: { id: true, name: true },
    take: 5,
  });
  
  // Map receipt cashier IDs to real staff IDs
  // staff-1 = first staff, staff-2 = second staff, etc.
  const cashierMap = new Map([
    ['staff-1', staffList[0]?.id],
    ['staff-2', staffList[1]?.id],
    ['staff-3', staffList[2]?.id],
  ]);

  for (const receipt of receipts) {
    const orderData = orderMap.get(receipt.orderId);
    if (!orderData) continue;

    const realCashierId = cashierMap.get(receipt.cashierId) || staffList[0]?.id;
    if (!realCashierId) {
      console.warn(`⚠️ No staff found for ${receipt.cashierId} — skipping receipt`);
      continue;
    }

    const itemsSnapshot = orderData.items.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    }));

    await prisma.receipt.create({
      data: {
        receiptNo: receipt.receiptNo,
        totalAmount: receipt.totalAmount,
        paidAmount: receipt.paidAmount,
        change: receipt.change,
        taxAmount: receipt.taxAmount,
        
        posId: receipt.posId,
        paymentMethod: receipt.paymentMethod,
        createdAt: receipt.createdAt,
        itemsSnapshot: itemsSnapshot,
        order: { connect: { id: orderData.id } },
        cashier: { connect: { id: realCashierId } },
      } as any,
    });
  }
  console.log(`✅ Seeded ${receipts.length} receipts`);
}

async function seedTimecards() {
  console.log('⏰ Seeding timecards...');
  const timecards = readCSV('timecards.csv');

  // Fetch staff and map
  const staffList = await prisma.staff.findMany({ 
    select: { id: true, name: true },
    take: 5,
  });
  
  const staffMap = new Map([
    ['staff-1', staffList[0]?.id],
    ['staff-2', staffList[1]?.id],
    ['staff-3', staffList[2]?.id],
  ]);

  for (const tc of timecards) {
    const realStaffId = staffMap.get(tc.staffId);
    const realVerifiedBy = staffMap.get(tc.verifiedBy) || staffList[0]?.id;
    
    if (!realStaffId) {
      console.warn(`⚠️ No staff found for ${tc.staffId} — skipping timecard`);
      continue;
    }

    await prisma.timecard.create({
      data: {
        staffId: realStaffId,
        clockIn: tc.clockIn,
        clockOut: tc.clockOut,
        breakMinutes: tc.breakMinutes,
        totalMinutes: tc.totalMinutes,
        totalHours: tc.totalHours,
        verifiedBy: realVerifiedBy,
      },
    });
  }
  console.log(`✅ Seeded ${timecards.length} timecards`);
}

async function main() {
  try {
    console.log('🧹 Clearing old transactional data...');
    await prisma.receipt.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.timecard.deleteMany();

    await seedOrders();
    await seedReceipts();
    await seedTimecards();
    console.log('🎉 Transactional seed complete!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();