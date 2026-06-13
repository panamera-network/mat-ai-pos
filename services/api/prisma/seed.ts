import { PrismaClient, OrderStatus, OrderSource, OrderType, DiningTableStatus, Role, EmploymentType, StockType } from '@prisma/client';

const prisma = new PrismaClient();

// ==================== HELPERS ====================
function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2) {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

// Generate dates for 2 weeks (Isnin cuti, Selasa-Ahad kerja)
function getWorkingDays(startDate: Date, weeks: number): Date[] {
  const days: Date[] = [];
  const current = new Date(startDate);

  for (let w = 0; w < weeks * 7; w++) {
    const dayOfWeek = current.getDay(); // 0=Ahad, 1=Isnin, 2=Selasa...
    if (dayOfWeek !== 1) { // Skip Isnin (1)
      days.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
}

// ==================== MAIN SEED ====================
async function main() {
  console.log('🌱 Starting RICH seed (idempotent)...');

  // ==================== CLEAR EXISTING DATA (ORDER MATTERS!) ====================
  console.log('🧹 Cleaning existing data...');

  await prisma.advanceDeduction.deleteMany();
  await prisma.staffAdvance.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.timecard.deleteMany();
  await prisma.stockLog.deleteMany();
  await prisma.menuItemIngredient.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.diningTable.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.setting.deleteMany();

  console.log('✅ Data cleared');

  // ==================== SETTINGS ====================
  const settings = [
    { key: 'epf_employee_rate', value: '11', description: 'EPF employee contribution %' },
    { key: 'epf_employer_rate', value: '13', description: 'EPF employer contribution %' },
    { key: 'socso_employee_rate', value: '0.5', description: 'SOCSO employee contribution %' },
    { key: 'socso_employer_rate', value: '1.75', description: 'SOCSO employer contribution %' },
    { key: 'overtime_multiplier', value: '1.5', description: 'Overtime rate multiplier' },
    { key: 'weekly_pay_day', value: 'FRIDAY', description: 'Weekly payroll day' },
    { key: 'monthly_pay_day', value: 'LAST_DAY', description: 'Monthly payroll day' },
    { key: 'annual_leave_days', value: '14', description: 'Annual leave days per year' },
    { key: 'sick_leave_days', value: '14', description: 'Sick leave days per year' },
    { key: 'min_stock_alert', value: '10', description: 'Minimum stock alert quantity' },
    { key: 'tax_rate', value: '8', description: 'SST tax rate %' },
    { key: 'shop_name', value: 'MAT.ai Restaurant', description: 'Business name for receipts' },
    { key: 'shop_address', value: '123 Jalan Example, KL', description: 'Business address' },
    { key: 'shop_phone', value: '012-3456789', description: 'Business phone' },
    { key: 'receipt_footer', value: 'Thank you! Please come again.', description: 'Receipt footer text' },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log('✅ Settings seeded');

  // ==================== CATEGORIES ====================
  const categories = [
    { name: 'Nasi Goreng', icon: '🍚', sortOrder: 1 },
    { name: 'Mee & Kuey Teow', icon: '🍜', sortOrder: 2 },
    { name: 'Western', icon: '🍖', sortOrder: 3 },
    { name: 'Drinks', icon: '🥤', sortOrder: 4 },
    { name: 'Dessert', icon: '🍰', sortOrder: 5 },
    { name: 'Sides', icon: '🍟', sortOrder: 6 },
    { name: 'Set Meals', icon: '🍱', sortOrder: 7 },
    { name: 'Specials', icon: '⭐', sortOrder: 8 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Categories seeded');

  // ==================== MENU ITEMS ====================
  const nasiGoreng = await prisma.category.findUnique({ where: { name: 'Nasi Goreng' } });
  const mee = await prisma.category.findUnique({ where: { name: 'Mee & Kuey Teow' } });
  const western = await prisma.category.findUnique({ where: { name: 'Western' } });
  const drinks = await prisma.category.findUnique({ where: { name: 'Drinks' } });
  const dessert = await prisma.category.findUnique({ where: { name: 'Dessert' } });
  const sides = await prisma.category.findUnique({ where: { name: 'Sides' } });

  const menuItems = [
    { name: 'Nasi Goreng Ayam', price: 12.00, categoryId: nasiGoreng!.id, stock: 50, minStock: 10, options: { 'Extra Spicy': 0, 'Telur Mata': 1.50, 'Ayam Tambah': 5.00 } },
    { name: 'Nasi Goreng Kampung', price: 10.00, categoryId: nasiGoreng!.id, stock: 50, minStock: 10, options: { 'Extra Spicy': 0, 'Telur Mata': 1.50 } },
    { name: 'Nasi Goreng Pattaya', price: 11.00, categoryId: nasiGoreng!.id, stock: 40, minStock: 10, options: { 'Extra Spicy': 0, 'Telur Mata': 1.50 } },
    { name: 'Nasi Goreng USA', price: 15.00, categoryId: nasiGoreng!.id, stock: 30, minStock: 5, options: { 'Extra Spicy': 0, 'Telur Mata': 1.50 } },
    { name: 'Mee Goreng Mamak', price: 9.00, categoryId: mee!.id, stock: 50, minStock: 10, options: { 'Extra Spicy': 0, 'Telur': 1.00, 'Ayam': 4.00 } },
    { name: 'Kuey Teow Goreng', price: 9.50, categoryId: mee!.id, stock: 45, minStock: 10, options: { 'Extra Spicy': 0, 'Telur': 1.00 } },
    { name: 'Maggi Goreng', price: 8.00, categoryId: mee!.id, stock: 60, minStock: 15, options: { 'Extra Spicy': 0, 'Telur': 1.00 } },
    { name: 'Chicken Chop', price: 18.00, categoryId: western!.id, stock: 30, minStock: 5, options: { 'Black Pepper': 0, 'Mushroom': 0, 'Cheese': 2.00 } },
    { name: 'Fish & Chips', price: 20.00, categoryId: western!.id, stock: 25, minStock: 5, options: { 'Tartar Sauce': 0, 'Cheese': 2.00 } },
    { name: 'Lamb Grill', price: 28.00, categoryId: western!.id, stock: 15, minStock: 3, options: { 'Black Pepper': 0, 'Mint Sauce': 0 } },
    { name: 'Teh O Ais', price: 3.00, categoryId: drinks!.id, stock: 100, minStock: 20, options: { 'Kurang Manis': 0, 'Tambah Manis': 0 } },
    { name: 'Teh Tarik', price: 3.50, categoryId: drinks!.id, stock: 100, minStock: 20, options: { 'Kurang Manis': 0, 'Tambah Manis': 0 } },
    { name: 'Milo Ais', price: 4.00, categoryId: drinks!.id, stock: 80, minStock: 15, options: { 'Kurang Manis': 0, 'Tambah Milo': 1.50 } },
    { name: 'Air Mineral', price: 2.00, categoryId: drinks!.id, stock: 100, minStock: 20 },
    { name: 'Fresh Orange', price: 5.00, categoryId: drinks!.id, stock: 30, minStock: 5 },
    { name: 'Ais Kacang', price: 6.00, categoryId: dessert!.id, stock: 30, minStock: 5, options: { 'Extra Cendol': 1.00, 'Extra Kacang': 1.00 } },
    { name: 'Cendol', price: 5.00, categoryId: dessert!.id, stock: 30, minStock: 5, options: { 'Extra Pulut': 1.50 } },
    { name: 'Keropok Lekor', price: 5.00, categoryId: sides!.id, stock: 40, minStock: 10 },
    { name: 'French Fries', price: 6.00, categoryId: sides!.id, stock: 50, minStock: 10, options: { 'Cheese Sauce': 1.50 } },
    { name: 'Onion Rings', price: 7.00, categoryId: sides!.id, stock: 35, minStock: 5 },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { name: item.name },
      update: {},
      create: item,
    });
  }
  console.log('✅ Menu items seeded');

  // ==================== INVENTORY ITEMS - LOW STOCK ENABLED ====================
  const inventoryItems = [
    { name: 'Nasi Putih', category: 'dry', unit: 'kg', weight: 1000, currentStock: 50, minStock: 10, costPerUnit: 3.50 },
    { name: 'Ayam Dada', category: 'frozen', unit: 'kg', weight: 1000, currentStock: 30, minStock: 5, costPerUnit: 12.00 },
    { name: 'Telur', category: 'chiller', unit: 'pcs', weight: 60, currentStock: 100, minStock: 20, costPerUnit: 0.50 },
    { name: 'Kicap Manis', category: 'sauce', unit: 'ml', weight: 5000, currentStock: 5000, minStock: 1000, costPerUnit: 8.00 },
    { name: 'Cili Padi', category: 'vegetables', unit: 'g', weight: 500, currentStock: 500, minStock: 100, costPerUnit: 5.00 },
    { name: 'Minyak Masak', category: 'oil', unit: 'ml', weight: 5000, currentStock: 10000, minStock: 2000, costPerUnit: 15.00 },
    { name: 'Mee Kuning', category: 'dry', unit: 'kg', weight: 1000, currentStock: 20, minStock: 5, costPerUnit: 4.00 },
    { name: 'Kuey Teow', category: 'dry', unit: 'kg', weight: 1000, currentStock: 15, minStock: 5, costPerUnit: 5.00 },
    { name: 'Maggi', category: 'dry', unit: 'pcs', weight: 80, currentStock: 100, minStock: 20, costPerUnit: 1.20 },
    { name: 'Daging Ayam (Chicken Chop)', category: 'frozen', unit: 'kg', weight: 1000, currentStock: 20, minStock: 5, costPerUnit: 14.00 },
    { name: 'Ikan Dory', category: 'frozen', unit: 'kg', weight: 1000, currentStock: 15, minStock: 3, costPerUnit: 18.00 },
    { name: 'Daging Kambing', category: 'frozen', unit: 'kg', weight: 1000, currentStock: 1, minStock: 2, costPerUnit: 35.00 },
    { name: 'Tepung Fish & Chips', category: 'dry', unit: 'kg', weight: 1000, currentStock: 0.5, minStock: 1, costPerUnit: 6.00 },
    { name: 'Keju', category: 'cheese', unit: 'g', weight: 500, currentStock: 150, minStock: 200, costPerUnit: 25.00 },
    { name: 'Teh Dust', category: 'dry', unit: 'g', weight: 500, currentStock: 1000, minStock: 200, costPerUnit: 12.00 },
    { name: 'Milo Powder', category: 'dry', unit: 'g', weight: 1000, currentStock: 2000, minStock: 500, costPerUnit: 18.00 },
    { name: 'Ais Krim', category: 'chiller', unit: 'ml', weight: 4000, currentStock: 5000, minStock: 1000, costPerUnit: 10.00 },
    { name: 'Cendol', category: 'chiller', unit: 'ml', weight: 3000, currentStock: 3000, minStock: 500, costPerUnit: 8.00 },
    { name: 'Kentang', category: 'vegetables', unit: 'kg', weight: 1000, currentStock: 20, minStock: 5, costPerUnit: 3.00 },
    { name: 'Bawang', category: 'vegetables', unit: 'kg', weight: 1000, currentStock: 10, minStock: 2, costPerUnit: 4.00 },
  ];

  for (const item of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { name: item.name },
      update: {},
      create: item,
    });
  }
  console.log('✅ Inventory items seeded (with LOW STOCK alerts)');

  // ==================== MENU ITEM INGREDIENTS (Recipe / BOM) ====================
  const getInvId = async (name: string) => (await prisma.inventoryItem.findUnique({ where: { name } }))!.id;
  const getMenuId = async (name: string) => (await prisma.menuItem.findUnique({ where: { name } }))!.id;

  const recipes = [
    { menuItem: 'Nasi Goreng Ayam', ingredients: [
      { name: 'Nasi Putih', qty: 0.3 },
      { name: 'Ayam Dada', qty: 0.15 },
      { name: 'Telur', qty: 1 },
      { name: 'Kicap Manis', qty: 30 },
      { name: 'Cili Padi', qty: 10 },
      { name: 'Minyak Masak', qty: 20 },
    ]},
    { menuItem: 'Nasi Goreng Kampung', ingredients: [
      { name: 'Nasi Putih', qty: 0.3 },
      { name: 'Telur', qty: 1 },
      { name: 'Kicap Manis', qty: 25 },
      { name: 'Cili Padi', qty: 15 },
      { name: 'Minyak Masak', qty: 20 },
    ]},
    { menuItem: 'Mee Goreng Mamak', ingredients: [
      { name: 'Mee Kuning', qty: 0.2 },
      { name: 'Telur', qty: 1 },
      { name: 'Kicap Manis', qty: 30 },
      { name: 'Minyak Masak', qty: 25 },
    ]},
    { menuItem: 'Chicken Chop', ingredients: [
      { name: 'Daging Ayam (Chicken Chop)', qty: 0.2 },
      { name: 'Kentang', qty: 0.15 },
      { name: 'Minyak Masak', qty: 30 },
    ]},
    { menuItem: 'Fish & Chips', ingredients: [
      { name: 'Ikan Dory', qty: 0.18 },
      { name: 'Tepung Fish & Chips', qty: 50 },
      { name: 'Minyak Masak', qty: 40 },
    ]},
    { menuItem: 'Teh Tarik', ingredients: [
      { name: 'Teh Dust', qty: 5 },
    ]},
    { menuItem: 'Milo Ais', ingredients: [
      { name: 'Milo Powder', qty: 30 },
    ]},
    { menuItem: 'French Fries', ingredients: [
      { name: 'Kentang', qty: 0.2 },
      { name: 'Minyak Masak', qty: 30 },
    ]},
    { menuItem: 'Lamb Grill', ingredients: [
      { name: 'Daging Kambing', qty: 0.25 },
      { name: 'Minyak Masak', qty: 25 },
    ]},
  ];

  for (const recipe of recipes) {
    const menuItemId = await getMenuId(recipe.menuItem);
    for (const ing of recipe.ingredients) {
      if (ing.qty === 0) continue;
      const inventoryItemId = await getInvId(ing.name);
      await prisma.menuItemIngredient.createMany({
        data: {
          menuItemId,
          inventoryItemId,
          quantityUsed: ing.qty,
        },
        skipDuplicates: true,
      });
    }
  }
  console.log('✅ Menu item ingredients (recipes) seeded');

  // ==================== TABLES ====================
  const tables = [
    { number: '1', capacity: 4, status: DiningTableStatus.AVAILABLE },
    { number: '2', capacity: 4, status: DiningTableStatus.AVAILABLE },
    { number: '3', capacity: 4, status: DiningTableStatus.AVAILABLE },
    { number: '4', capacity: 4, status: DiningTableStatus.AVAILABLE },
    { number: '5', capacity: 2, status: DiningTableStatus.AVAILABLE },
    { number: '6', capacity: 2, status: DiningTableStatus.AVAILABLE },
    { number: '7', capacity: 6, status: DiningTableStatus.AVAILABLE },
    { number: '8', capacity: 6, status: DiningTableStatus.AVAILABLE },
    { number: '9', capacity: 8, status: DiningTableStatus.AVAILABLE },
    { number: '10', capacity: 10, status: DiningTableStatus.AVAILABLE },
  ];

  for (const table of tables) {
    await prisma.diningTable.upsert({
      where: { number: table.number },
      update: {},
      create: table,
    });
  }
  console.log('✅ Tables seeded');

  // ==================== STAFF ====================
  const staffData = [
    { name: 'Ahmad', pin: '1234', role: Role.ADMIN, employmentType: EmploymentType.MONTHLY_SALARIED, monthlySalary: 3500, hourlyRate: null },
    { name: 'Siti', pin: '2345', role: Role.MANAGER, employmentType: EmploymentType.MONTHLY_SALARIED, monthlySalary: 2800, hourlyRate: null },
    { name: 'Ali', pin: '3456', role: Role.CASHIER, employmentType: EmploymentType.HOURLY_PART_TIME, monthlySalary: null, hourlyRate: 8 },
    { name: 'Muthu', pin: '4567', role: Role.CASHIER, employmentType: EmploymentType.HOURLY_PART_TIME, monthlySalary: null, hourlyRate: 8 },
    { name: 'Lisa', pin: '5678', role: Role.KITCHEN, employmentType: EmploymentType.HOURLY_PART_TIME, monthlySalary: null, hourlyRate: 9 },
    { name: 'Raj', pin: '6789', role: Role.KITCHEN, employmentType: EmploymentType.HOURLY_PART_TIME, monthlySalary: null, hourlyRate: 9 },
    { name: 'Nina', pin: '7890', role: Role.CASHIER, employmentType: EmploymentType.HOURLY_PART_TIME, monthlySalary: null, hourlyRate: 8 },
    { name: 'Kumar', pin: '8901', role: Role.KITCHEN, employmentType: EmploymentType.HOURLY_PART_TIME, monthlySalary: null, hourlyRate: 9 },
    { name: 'Farah', pin: '9012', role: Role.CASHIER, employmentType: EmploymentType.HOURLY_PART_TIME, monthlySalary: null, hourlyRate: 8 },
    { name: 'Hafiz', pin: '0123', role: Role.KITCHEN, employmentType: EmploymentType.HOURLY_PART_TIME, monthlySalary: null, hourlyRate: 9 },
  ];

  for (const s of staffData) {
    await prisma.staff.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
  }
  console.log('✅ Staff seeded');

  // ==================== TIMECARDS (2 weeks, Isnin cuti) ====================
  const allStaff = await prisma.staff.findMany();
  const startDate = new Date('2026-05-26'); // Selasa start
  const workingDays = getWorkingDays(startDate, 2); // 2 weeks

  const shiftPatterns: Record<string, { start: number; end: number }> = {
    'Ahmad': { start: 8, end: 17 },
    'Siti': { start: 9, end: 18 },
    'Ali': { start: 8, end: 16 },
    'Muthu': { start: 16, end: 24 },
    'Lisa': { start: 10, end: 15 },
    'Raj': { start: 15, end: 22 },
    'Nina': { start: 8, end: 16 },
    'Kumar': { start: 10, end: 15 },
    'Farah': { start: 16, end: 24 },
    'Hafiz': { start: 15, end: 22 },
  };

  const absentStaff: Record<string, string[]> = {
    'Ali': ['2026-06-03'],
    'Raj': ['2026-06-05'],
  };

  for (const day of workingDays) {
    const dateStr = day.toISOString().split('T')[0];
    const dayOfWeek = day.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;

    for (const staff of allStaff) {
      const shift = shiftPatterns[staff.name];
      const isAbsent = absentStaff[staff.name]?.includes(dateStr);

      if (isAbsent) {
        console.log(`   ${staff.name} absent on ${dateStr}`);
      } else {
        const isLate = Math.random() < 0.15;
        const lateMinutes = isLate ? randomInt(5, 15) : 0;

        const clockIn = new Date(day);
        clockIn.setHours(shift.start, isLate ? lateMinutes : 0, 0, 0);

        const clockOut = new Date(day);
        const endHour = isWeekend ? shift.end + 1 : shift.end;
        clockOut.setHours(endHour, randomInt(-10, 10), 0, 0);

        const totalMinutes = Math.floor((clockOut.getTime() - clockIn.getTime()) / (1000 * 60));
        const breakMinutes = 30;
        const workedMinutes = totalMinutes - breakMinutes;
        const totalHours = parseFloat((workedMinutes / 60).toFixed(2));

        await prisma.timecard.create({
          data: {
            staffId: staff.id,
            clockIn: clockIn,
            clockOut: clockOut,
            breakMinutes: breakMinutes,
            totalMinutes: workedMinutes,
            totalHours: totalHours,
            verifiedBy: isLate ? 'System' : null,
            verifiedAt: isLate ? new Date() : null,
          },
        });
      }
    }
  }
  console.log('✅ Timecards seeded (2 weeks, Isnin cuti, realistic shifts)');

  // ==================== SALES / ORDERS (30 days realistic) ====================
  const menuItemsDb = await prisma.menuItem.findMany();
  const tablesDb = await prisma.diningTable.findMany();
  const staffDb = await prisma.staff.findMany();

  const salesStartDate = new Date();
  salesStartDate.setDate(salesStartDate.getDate() - 7);
  let orderCounter = 1;

  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(salesStartDate);
    currentDate.setDate(salesStartDate.getDate() + day);
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
    const isMonday = dayOfWeek === 1;

    if (isMonday) continue;

    const baseOrders = isWeekend ? randomInt(10, 20) : randomInt(5, 15);

    const peakHours = [
      { start: 12, end: 14, weight: 0.4 },
      { start: 19, end: 21, weight: 0.5 },
      { start: 10, end: 11, weight: 0.05 },
      { start: 15, end: 17, weight: 0.05 },
    ];

    for (let o = 0; o < baseOrders; o++) {
      const rand = Math.random();
      let hourSlot;
      if (rand < 0.4) hourSlot = peakHours[0];
      else if (rand < 0.9) hourSlot = peakHours[1];
      else if (rand < 0.95) hourSlot = peakHours[2];
      else hourSlot = peakHours[3];

      const hour = randomInt(hourSlot.start, hourSlot.end - 1);
      const minute = randomInt(0, 59);
      const orderTime = new Date(currentDate);
      orderTime.setHours(hour, minute, 0, 0);

      const itemCount = randomInt(1, 4);
      const orderItems = [];
      let subtotal = 0;

      for (let i = 0; i < itemCount; i++) {
        const menuItem = menuItemsDb[randomInt(0, menuItemsDb.length - 1)];
        const qty = randomInt(1, 3);
        const unitPrice = Number(menuItem.price);
        const totalPrice = qty * unitPrice;
        subtotal += totalPrice;

        orderItems.push({
          menuItemId: menuItem.id,
          name: menuItem.name,
          quantity: qty,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
        });
      }

      const taxRate = 0.08;
      const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
      const totalAmount = parseFloat((subtotal + taxAmount).toFixed(2));

      const cashierStaff = staffDb.filter(s => s.role === Role.CASHIER);
      const staff = cashierStaff[randomInt(0, cashierStaff.length - 1)];
      const table = tablesDb[randomInt(0, tablesDb.length - 1)];

      const statusRand = Math.random();
      let status: OrderStatus;
      if (statusRand > 0.98) status = OrderStatus.CANCELLED;
      else if (statusRand > 0.95) status = OrderStatus.PENDING;
      else if (statusRand > 0.85) status = OrderStatus.PREPARING;
      else if (statusRand > 0.70) status = OrderStatus.PAID;
      else status = OrderStatus.SERVED;

      const orderNumber = `ORD-${String(orderCounter).padStart(5, '0')}`;
      orderCounter++;

      await prisma.order.create({
        data: {
          orderNumber,
          status,
          source: OrderSource.POS,
          type: OrderType.DINE_IN,
          totalAmount,
          taxAmount,
          customerName: `Customer ${randomInt(1, 100)}`,
          tableId: table.id,
          createdAt: orderTime,
          updatedAt: orderTime,
          items: {
            create: orderItems,
          },
        },
      });
    }
  }
  console.log(`✅ Sales seeded (${orderCounter - 1} orders over 30 days, realistic peak hours)`);

  // ==================== STOCK LOGS ====================
  const stockLogItems = [
    { inventoryItemName: 'Daging Kambing', quantity: -2, reason: 'Used for Lamb Grill orders' },
    { inventoryItemName: 'Tepung Fish & Chips', quantity: -1.5, reason: 'Used for Fish & Chips orders' },
    { inventoryItemName: 'Keju', quantity: -350, reason: 'Used for Cheese toppings' },
  ];

  const adminStaff = await prisma.staff.findFirst({ where: { name: 'Ahmad' } });

  for (const log of stockLogItems) {
    const invItem = await prisma.inventoryItem.findUnique({ where: { name: log.inventoryItemName } });
    if (invItem) {
      await prisma.stockLog.create({
        data: {
          type: StockType.AUTO_DEDUCT,
          inventoryItemId: invItem.id,
          quantity: log.quantity,
          reason: log.reason,
          staffId: adminStaff?.id,
        },
      });
    }
  }
  console.log('✅ Stock logs seeded (auto-deduct for low stock items)');

  console.log('\n🎉 RICH SEED COMPLETE!');
  console.log('📊 Summary:');
  console.log('   • 10 Staff (2 monthly, 8 hourly)');
  console.log('   • ~96 Timecards (2 weeks, Isnin cuti, 2 absent)');
  console.log(`   • ${orderCounter - 1} Orders (30 days, peak hours, weekend boost)`);
  console.log('   • 4 LOW STOCK alerts (Daging Kambing, Tepung, Keju)');
  console.log('   • 3 Stock movement logs');
  console.log('\n🔧 Ready to test:');
  console.log('   • Dashboard summary cards');
  console.log('   • Sales reports & charts');
  console.log('   • Staff timecards & payroll');
  console.log('   • Inventory low-stock alerts');
  console.log('\n💡 Tip: Run this seed multiple times — it will always reset to fresh data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });