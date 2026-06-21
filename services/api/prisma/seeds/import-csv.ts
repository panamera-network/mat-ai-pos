import { PrismaClient, EmploymentType, DiningTableStatus, OrderStatus, OrderSource, OrderType, StockType } from '@prisma/client';
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
      if (value === '') return undefined;
      if (value === 'true') return true;
      if (value === 'false') return false;
      
      // Force string for settings value column
      if (filename === 'settings.csv' && context.column === 'value') {
        return String(value);
      }
      
      if (value.startsWith('{') && value.endsWith('}')) {
        try { return JSON.parse(value); } catch { return value; }
      }
      
      if (!isNaN(Number(value)) && 
          context.column !== 'pin' && 
          context.column !== 'phone' && 
          context.column !== 'name' && 
          context.column !== 'number') {
        return Number(value);
      }
      
      return value;
    },
  });
}

async function clearData() {
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
  await prisma.preCookIngredient.deleteMany();
  await prisma.preCookProduct.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.diningTable.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.department.deleteMany();
  await prisma.role.deleteMany();
  await prisma.outlet.deleteMany();
  await prisma.setting.deleteMany();
  console.log('✅ Data cleared');
}

async function importOutlets() {
  const rows = readCSV('outlets.csv');
  for (const row of rows) {
    await prisma.outlet.upsert({
      where: { id: row.id },
      update: {},
      create: {
        id: row.id,
        name: row.name,
        address: row.address,
        phone: row.phone,
        isActive: row.isActive,
      },
    });
  }
  console.log(`✅ ${rows.length} outlets imported`);
}

async function importDepartments() {
  const rows = readCSV('departments.csv');
  for (const row of rows) {
    await prisma.department.upsert({
      where: { id: row.id },
      update: {},
      create: {
        id: row.id,
        name: row.name,
        isActive: row.isActive,
      },
    });
  }
  console.log(`✅ ${rows.length} departments imported`);
}

async function importRoles() {
  const rows = readCSV('roles.csv');
  for (const row of rows) {
    await prisma.role.upsert({
      where: { id: row.id },
      update: {},
      create: {
        id: row.id,
        name: row.name,
        permissions: row.permissions as any,
        isActive: row.isActive,
        isSystem: row.isSystem,
      },
    });
  }
  console.log(`✅ ${rows.length} roles imported`);
}

async function importStaff() {
  const rows = readCSV('staff.csv');
  for (const row of rows) {
    await prisma.staff.upsert({
      where: { name: row.name },
      update: {},
      create: {
        name: row.name,
        email: row.email,
        password: row.password,
        pin: row.pin,
        phone: row.phone,
        roleId: row.roleId || null,
        isSuperAdmin: row.isSuperAdmin,
        isActive: true,
        employmentType: row.employmentType as EmploymentType,
        monthlySalary: row.monthlySalary,
        hourlyRate: row.hourlyRate,
        departmentId: row.departmentId || null,
        outletId: row.outletId || null,
      },
    });
  }
  console.log(`✅ ${rows.length} staff imported`);
}

async function importSettings() {
  const rows = readCSV('settings.csv');
  for (const row of rows) {
    await prisma.setting.upsert({
      where: { key: row.key },
      update: {},
      create: {
        key: row.key,
        value: row.value,
        description: row.description,
      },
    });
  }
  console.log(`✅ ${rows.length} settings imported`);
}

async function importCategories() {
  const rows = readCSV('categories.csv');
  for (const row of rows) {
    await prisma.category.upsert({
      where: { name: row.name },
      update: {},
      create: {
        name: row.name,
        icon: row.icon,
        sortOrder: row.sortOrder,
        isActive: row.isActive,
      },
    });
  }
  console.log(`✅ ${rows.length} categories imported`);
}

async function importTables() {
  const rows = readCSV('tables.csv');
  for (const row of rows) {
    await prisma.diningTable.upsert({
      where: { number: row.number },
      update: {},
      create: {
        number: String(row.number),
        capacity: row.capacity,
        status: row.status as DiningTableStatus,
      },
    });
  }
  console.log(`✅ ${rows.length} tables imported`);
}

// ==================== RAW MATERIALS ====================

async function importRawMaterials() {
  const rows = readCSV('raw_materials.csv');
  
  for (const row of rows) {
    if (!row.name || row.name.trim() === '') continue;
    
    await prisma.inventoryItem.upsert({
      where: { name: row.name },
      update: {},
      create: {
        name: row.name,
        category: row.category || 'UNCATEGORIZED',
        unit: row.unit || 'g',
        weight: row.packageWeight,
        currentStock: 0,
        minStock: 0,
        costPerUnit: row.unitPrice,
        isActive: true,
        unitPrice: row.unitPrice,
        unitOfMeasure: row.unit || 'g',
        openStock: 0,
        stockIn: 0,
        stockOut: 0,
      },
    });
  }
  console.log(`✅ ${rows.length} raw materials imported`);
}

// ==================== PRE-COOK PRODUCTS ====================

async function importPreCookProducts() {
  const rows = readCSV('pre_cook_products.csv');
  
  const grouped: Record<string, any[]> = {};
  for (const row of rows) {
    if (!grouped[row.preCookName]) grouped[row.preCookName] = [];
    grouped[row.preCookName].push(row);
  }

  for (const [preCookName, ingredients] of Object.entries(grouped)) {
    const preCook = await prisma.preCookProduct.upsert({
      where: { name: preCookName },
      update: {},
      create: {
        name: preCookName,
        description: `Pre-cooked ${preCookName}`,
        cost: 0,
        isActive: true,
      },
    });

    for (const ing of ingredients) {
      if (ing.rawMaterialName === 'PER SERVING') {
        await prisma.preCookProduct.update({
          where: { id: preCook.id },
          data: { cost: ing.cost || 0 },
        });
        continue;
      }

      const inventoryItem = await prisma.inventoryItem.findUnique({
        where: { name: ing.rawMaterialName },
      });

      if (!inventoryItem) {
        console.warn(`⚠️ Inventory item not found: ${ing.rawMaterialName}`);
        continue;
      }

      await prisma.preCookIngredient.upsert({
        where: {
          preCookId_inventoryItemId: {
            preCookId: preCook.id,
            inventoryItemId: inventoryItem.id,
          },
        },
        update: {
          quantityUsed: ing.quantity,
        },
        create: {
          preCookId: preCook.id,
          inventoryItemId: inventoryItem.id,
          quantityUsed: ing.quantity,
        },
      });
    }
  }
  console.log(`✅ Pre-cook products imported`);
}

// ==================== MENU ITEMS ====================

async function importMenuItems() {
  const rows = readCSV('menu_items.csv');
  
  for (const row of rows) {
    let category = await prisma.category.findFirst({
      where: { name: row.category },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          name: row.category,
          icon: '🍽️',
          sortOrder: 99,
          isActive: true,
        },
      });
    }

    await prisma.menuItem.upsert({
      where: { name: row.name },
      update: {},
      create: {
        id: String(row.id),
        name: row.name,
        price: row.sellingPrice,
        categoryId: category.id,
        isAvailable: row.isActive === true || row.isActive === 'True' || row.isActive === 'true',  // ← FIX
        stock: 100,
        minStock: 10,
        cost: row.costPrice,
        profitMargin: row.sellingPrice > 0 
          ? ((row.sellingPrice - row.costPrice) / row.sellingPrice) * 100 
          : 0,
      },
    });
  }
  console.log(`✅ ${rows.length} menu items imported`);
}

// ==================== MENU INGREDIENTS ====================

async function importMenuIngredients() {
  const rows = readCSV('menu_ingredients.csv');
  
  for (const row of rows) {
    // Lookup by name instead of ID
    const menuItem = await prisma.menuItem.findUnique({
      where: { name: row.menuItemName },
    });

    if (!menuItem) {
      console.warn(`⚠️ Menu item not found: ${row.menuItemName}`);
      continue;
    }

    // Check if rawMaterialName is a pre-cook product
    const preCook = await prisma.preCookProduct.findUnique({
      where: { name: row.rawMaterialName },
    });

    if (preCook) {
      await prisma.menuItemIngredient.create({
        data: {
          menuItemId: menuItem.id,
          preCookId: preCook.id,
          quantityUsed: row.quantity,
          unit: 'g',
        },
      });
    } else {
      // Link as raw material ingredient
      const inventoryItem = await prisma.inventoryItem.findUnique({
        where: { name: row.rawMaterialName },
      });

      if (!inventoryItem) {
        console.warn(`⚠️ Neither pre-cook nor inventory item found: ${row.rawMaterialName}`);
        continue;
      }

      await prisma.menuItemIngredient.create({
        data: {
          menuItemId: menuItem.id,
          inventoryItemId: inventoryItem.id,
          quantityUsed: row.quantity,
          unit: inventoryItem.unitOfMeasure || 'g',
        },
      });
    }
  }
  console.log(`✅ Menu ingredients imported`);
}

async function main() {
  console.log('🌱 Starting CSV seed...');
  await clearData();
  await importOutlets();
  await importDepartments();
  await importRoles();
  await importStaff();
  await importSettings();
  await importCategories();
  await importTables();
  await importRawMaterials();
  await importPreCookProducts();
  await importMenuItems();
  await importMenuIngredients();
  console.log('\n🎉 CSV SEED COMPLETE!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });