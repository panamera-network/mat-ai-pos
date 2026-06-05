import { PrismaClient, OrderStatus, ItemStatus, OrderSource, OrderType, TableStatus, Role, EmploymentType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

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
    // Nasi Goreng
    { name: 'Nasi Goreng Ayam', price: 12.00, categoryId: nasiGoreng!.id, stock: 50, minStock: 10, options: { 'Extra Spicy': 0, 'Telur Mata': 1.50, 'Ayam Tambah': 5.00 } },
    { name: 'Nasi Goreng Kampung', price: 10.00, categoryId: nasiGoreng!.id, stock: 50, minStock: 10, options: { 'Extra Spicy': 0, 'Telur Mata': 1.50 } },
    { name: 'Nasi Goreng Pattaya', price: 11.00, categoryId: nasiGoreng!.id, stock: 40, minStock: 10, options: { 'Extra Spicy': 0, 'Telur Mata': 1.50 } },
    { name: 'Nasi Goreng USA', price: 15.00, categoryId: nasiGoreng!.id, stock: 30, minStock: 5, options: { 'Extra Spicy': 0, 'Telur Mata': 1.50 } },
    
    // Mee
    { name: 'Mee Goreng Mamak', price: 9.00, categoryId: mee!.id, stock: 50, minStock: 10, options: { 'Extra Spicy': 0, 'Telur': 1.00, 'Ayam': 4.00 } },
    { name: 'Kuey Teow Goreng', price: 9.50, categoryId: mee!.id, stock: 45, minStock: 10, options: { 'Extra Spicy': 0, 'Telur': 1.00 } },
    { name: 'Maggi Goreng', price: 8.00, categoryId: mee!.id, stock: 60, minStock: 15, options: { 'Extra Spicy': 0, 'Telur': 1.00 } },
    
    // Western
    { name: 'Chicken Chop', price: 18.00, categoryId: western!.id, stock: 30, minStock: 5, options: { 'Black Pepper': 0, 'Mushroom': 0, 'Cheese': 2.00 } },
    { name: 'Fish & Chips', price: 20.00, categoryId: western!.id, stock: 25, minStock: 5, options: { 'Tartar Sauce': 0, 'Cheese': 2.00 } },
    { name: 'Lamb Grill', price: 28.00, categoryId: western!.id, stock: 15, minStock: 3, options: { 'Black Pepper': 0, 'Mint Sauce': 0 } },
    
    // Drinks
    { name: 'Teh O Ais', price: 3.00, categoryId: drinks!.id, stock: 100, minStock: 20, options: { 'Kurang Manis': 0, 'Tambah Manis': 0 } },
    { name: 'Teh Tarik', price: 3.50, categoryId: drinks!.id, stock: 100, minStock: 20, options: { 'Kurang Manis': 0, 'Tambah Manis': 0 } },
    { name: 'Milo Ais', price: 4.00, categoryId: drinks!.id, stock: 80, minStock: 15, options: { 'Kurang Manis': 0, 'Tambah Milo': 1.50 } },
    { name: 'Air Mineral', price: 2.00, categoryId: drinks!.id, stock: 100, minStock: 20 },
    { name: 'Fresh Orange', price: 5.00, categoryId: drinks!.id, stock: 30, minStock: 5 },
    
    // Dessert
    { name: 'Ais Kacang', price: 6.00, categoryId: dessert!.id, stock: 30, minStock: 5, options: { 'Extra Cendol': 1.00, 'Extra Kacang': 1.00 } },
    { name: 'Cendol', price: 5.00, categoryId: dessert!.id, stock: 30, minStock: 5, options: { 'Extra Pulut': 1.50 } },
    
    // Sides
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

  // ==================== TABLES ====================
  const tables = [
    { number: '1', capacity: 4, status: TableStatus.AVAILABLE },
    { number: '2', capacity: 4, status: TableStatus.AVAILABLE },
    { number: '3', capacity: 4, status: TableStatus.AVAILABLE },
    { number: '4', capacity: 4, status: TableStatus.AVAILABLE },
    { number: '5', capacity: 2, status: TableStatus.AVAILABLE },
    { number: '6', capacity: 2, status: TableStatus.AVAILABLE },
    { number: '7', capacity: 6, status: TableStatus.AVAILABLE },
    { number: '8', capacity: 6, status: TableStatus.AVAILABLE },
    { number: '9', capacity: 8, status: TableStatus.AVAILABLE },
    { number: '10', capacity: 10, status: TableStatus.AVAILABLE },
  ];

  for (const table of tables) {
    await prisma.table.upsert({
      where: { number: table.number },
      update: {},
      create: table,
    });
  }
  console.log('✅ Tables seeded');

  // ==================== STAFF ====================
  const staff = [
    { name: 'Ahmad', pin: '1234', role: Role.ADMIN, employmentType: EmploymentType.MONTHLY_SALARIED, monthlySalary: 3500 },
    { name: 'Siti', pin: '2345', role: Role.MANAGER, employmentType: EmploymentType.MONTHLY_SALARIED, monthlySalary: 2800 },
    { name: 'Ali', pin: '3456', role: Role.CASHIER, employmentType: EmploymentType.HOURLY_PART_TIME, hourlyRate: 8 },
    { name: 'Muthu', pin: '4567', role: Role.CASHIER, employmentType: EmploymentType.HOURLY_PART_TIME, hourlyRate: 8 },
    { name: 'Lisa', pin: '5678', role: Role.KITCHEN, employmentType: EmploymentType.HOURLY_PART_TIME, hourlyRate: 9 },
    { name: 'Raj', pin: '6789', role: Role.KITCHEN, employmentType: EmploymentType.HOURLY_PART_TIME, hourlyRate: 9 },
    { name: 'Nina', pin: '7890', role: Role.CASHIER, employmentType: EmploymentType.HOURLY_PART_TIME, hourlyRate: 8 },
    { name: 'Kumar', pin: '8901', role: Role.KITCHEN, employmentType: EmploymentType.HOURLY_PART_TIME, hourlyRate: 9 },
    { name: 'Farah', pin: '9012', role: Role.CASHIER, employmentType: EmploymentType.HOURLY_PART_TIME, hourlyRate: 8 },
    { name: 'Hafiz', pin: '0123', role: Role.KITCHEN, employmentType: EmploymentType.HOURLY_PART_TIME, hourlyRate: 9 },
  ];

  for (const s of staff) {
    await prisma.staff.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
  }
  console.log('✅ Staff seeded');

  // ==================== SAMPLE ORDERS ====================
  const table1 = await prisma.table.findUnique({ where: { number: '1' } });
  const staffAhmad = await prisma.staff.findUnique({ where: { name: 'Ahmad' } });

  const sampleOrder = await prisma.order.create({
    data: {
      orderNumber: 'ORD-001',
      status: OrderStatus.PENDING,
      source: OrderSource.POS,
      type: OrderType.DINE_IN,
      totalAmount: 25.50,
      taxAmount: 2.04,
      customerName: 'Test Customer',
      tableId: table1!.id,
      items: {
        create: [
          {
            menuItemId: (await prisma.menuItem.findUnique({ where: { name: 'Nasi Goreng Ayam' } }))!.id,
            name: 'Nasi Goreng Ayam',
            quantity: 1,
            unitPrice: 12.00,
            totalPrice: 12.00,
            options: { 'Telur Mata': true },
          },
          {
            menuItemId: (await prisma.menuItem.findUnique({ where: { name: 'Teh Tarik' } }))!.id,
            name: 'Teh Tarik',
            quantity: 2,
            unitPrice: 3.50,
            totalPrice: 7.00,
          },
        ],
      },
    },
  });
  console.log('✅ Sample order seeded:', sampleOrder.id);

  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });