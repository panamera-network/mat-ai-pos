import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed Menu Items
  const menuItems = await prisma.menuItem.createMany({
    data: [
      {
        name: 'Nasi Lemak Ayam Goreng',
        description: 'Nasi lemak dengan ayam goreng berempah, sambal, kacang, ikan bilis, dan telur rebus',
        price: 15.00,
        category: 'Makanan',
        isAvailable: true,
        options: {
          spiciness: ['mild', 'medium', 'extra'],
          portion: ['regular', 'large'],
        },
      },
      {
        name: 'Nasi Lemak Sotong',
        description: 'Nasi lemak dengan sotong goreng tepung rangup',
        price: 18.00,
        category: 'Makanan',
        isAvailable: true,
        options: {
          spiciness: ['mild', 'medium', 'extra'],
        },
      },
      {
        name: 'Mee Goreng Mamak',
        description: 'Mee goreng style mamak dengan sayur, tofu, dan telur',
        price: 12.00,
        category: 'Makanan',
        isAvailable: true,
        options: {
          spiciness: ['mild', 'medium', 'extra'],
          extras: ['telur', 'ayam', 'sotong'],
        },
      },
      {
        name: 'Roti Canai',
        description: 'Roti canai lembut dengan kuah dhal dan kari ayam',
        price: 3.50,
        category: 'Roti',
        isAvailable: true,
        options: {
          type: ['plain', 'telur', 'bawang', 'susu'],
        },
      },
      {
        name: 'Teh Tarik',
        description: 'Teh tarik kaw, manis secukup rasa',
        price: 3.50,
        category: 'Minuman',
        isAvailable: true,
        options: {
          sweetness: ['less sugar', 'normal', 'extra sweet'],
          temperature: ['hot', 'cold'],
        },
      },
      {
        name: 'Kopi O',
        description: 'Kopi O pekat tradisional',
        price: 3.00,
        category: 'Minuman',
        isAvailable: true,
        options: {
          sugar: ['no sugar', 'less sugar', 'normal'],
        },
      },
      {
        name: 'Milo Ais',
        description: 'Milo ais kaw dengan susu pekat',
        price: 5.00,
        category: 'Minuman',
        isAvailable: true,
        options: {
          topping: ['none', 'ice cream', 'cincau'],
        },
      },
      {
        name: 'Satay Ayam (10 cucuk)',
        description: 'Satay ayam bakar dengan kuah kacang, nasi impit, dan timun',
        price: 15.00,
        category: 'Makanan',
        isAvailable: true,
        options: {
          meat: ['ayam', 'daging', 'kambing'],
        },
      },
    ],
    skipDuplicates: true,
  });

  console.log(`✅ ${menuItems.count} menu items seeded`);

  // Seed Tables
  const tables = await prisma.table.createMany({
    data: [
      { number: 'T01', name: 'Table 1', capacity: 2, status: 'AVAILABLE' },
      { number: 'T02', name: 'Table 2', capacity: 2, status: 'AVAILABLE' },
      { number: 'T03', name: 'Table 3', capacity: 4, status: 'AVAILABLE' },
      { number: 'T04', name: 'Table 4', capacity: 4, status: 'AVAILABLE' },
      { number: 'T05', name: 'Table 5', capacity: 4, status: 'AVAILABLE' },
      { number: 'T06', name: 'Table 6', capacity: 6, status: 'AVAILABLE' },
      { number: 'T07', name: 'Table 7', capacity: 6, status: 'AVAILABLE' },
      { number: 'T08', name: 'Table 8', capacity: 8, status: 'AVAILABLE' },
      { number: 'T09', name: 'Table 9', capacity: 8, status: 'AVAILABLE' },
      { number: 'T10', name: 'Table 10', capacity: 10, status: 'AVAILABLE' },
    ],
    skipDuplicates: true,
  });

  console.log(`✅ ${tables.count} tables seeded`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });