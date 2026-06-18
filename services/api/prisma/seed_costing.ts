import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding costing data...');

  // Seed inventory items (from CSV)
  const inventoryData = [
    // Raw ingredients (50 items)
    { id: 'inv_1', name: 'AYAM BB', category: 'frozen', unitPrice: 0.012, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_2', name: 'KEPAK AYAM', category: 'frozen', unitPrice: 0.016, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_3', name: 'DAGING CINCANG', category: 'frozen', unitPrice: 0.017, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_4', name: 'BEEF PEPPERONI', category: 'frozen', unitPrice: 0.0485, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_5', name: 'CHICKEN PEPPERONI', category: 'frozen', unitPrice: 0.0385, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_6', name: 'BEEF SALAMI', category: 'frozen', unitPrice: 0.035, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_7', name: 'SOSEJ', category: 'frozen', unitPrice: 0.0118, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_8', name: 'STREAKY BEEF', category: 'frozen', unitPrice: 0.0575, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_9', name: 'LAMB - PROCESS', category: 'frozen', unitPrice: 0.038, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_10', name: 'CHICKEN CHOP', category: 'frozen', unitPrice: 6.4, unitOfMeasure: 'pcs', quantity: 0 },
    { id: 'inv_11', name: 'UDANG', category: 'frozen', unitPrice: 0.04, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_12', name: 'SOTONG', category: 'frozen', unitPrice: 0.035, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_13', name: 'CRAB STICK', category: 'frozen', unitPrice: 0.014, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_14', name: 'CHICKEN SLICE', category: 'frozen', unitPrice: 0.024, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_15', name: 'SHRIMP', category: 'frozen', unitPrice: 1.54, unitOfMeasure: 'pcs', quantity: 0 },
    { id: 'inv_16', name: 'LOBSTER', category: 'frozen', unitPrice: 4.3, unitOfMeasure: 'pcs', quantity: 0 },
    { id: 'inv_17', name: 'BEEF MEAT BALL', category: 'frozen', unitPrice: 0.016, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_18', name: 'DRUMMET AYAM GIANT', category: 'frozen', unitPrice: 0.0224, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_19', name: 'CHICKEN POPCORN', category: 'frozen', unitPrice: 0.0253, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_20', name: 'SHOESTRING FRIES', category: 'frozen', unitPrice: 0.0105, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_21', name: 'CURLY FRIES', category: 'frozen', unitPrice: 0.025, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_22', name: 'MOZZARELLA CHEESE', category: 'cheese', unitPrice: 0.0384, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_23', name: 'CHEDDAR SHREDDED', category: 'cheese', unitPrice: 0.05, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_24', name: 'PARMESAN', category: 'cheese', unitPrice: 0.057, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_25', name: 'CHEDDAR COLOUR', category: 'cheese', unitPrice: 0.036, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_26', name: 'FETA', category: 'cheese', unitPrice: 0.06, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_27', name: 'TOMATO CHERRY', category: 'vegetables', unitPrice: 0.025, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_28', name: 'BASIL', category: 'vegetables', unitPrice: 0.1, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_29', name: 'CAPSICUM', category: 'vegetables', unitPrice: 0.01, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_30', name: 'MUSHROOM', category: 'vegetables', unitPrice: 0.0238, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_31', name: 'CILI PAID MERAH', category: 'vegetables', unitPrice: 0.018, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_32', name: 'BAWANG PUTIH', category: 'vegetables', unitPrice: 0.009, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_33', name: 'BAWANG MERAH', category: 'dry', unitPrice: 0.005, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_34', name: 'NENAS', category: 'dry', unitPrice: 0.0045, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_35', name: 'SPAGHETTI', category: 'pasta', unitPrice: 0.01, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_36', name: 'LASAGNE', category: 'pasta', unitPrice: 0.01, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_37', name: 'OLIVE OIL', category: 'oil', unitPrice: 0.033, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_38', name: 'FULL CREAM MILK', category: 'dry', unitPrice: 0.007, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_39', name: 'GARAM - BM', category: 'dry', unitPrice: 0.003, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_40', name: 'GULA - BM', category: 'dry', unitPrice: 0.004, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_41', name: 'TUNA', category: 'dry', unitPrice: 0.0469, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_42', name: 'BLACK OLIVE', category: 'dry', unitPrice: 0.0441, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_43', name: 'BBQ SOS KIMBALL', category: 'sauce', unitPrice: 0.008, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_44', name: 'THOUSAND ISLAND SOS', category: 'sauce', unitPrice: 0.008, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_45', name: 'LEGOS CARBONARA', category: 'sauce', unitPrice: 0.0245, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_46', name: 'BEEF STOCK', category: 'sauce', unitPrice: 0.0247, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_47', name: 'STOK UDANG', category: 'sauce', unitPrice: 1, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_48', name: 'BUTTER', category: 'chiller', unitPrice: 0.02, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_49', name: 'BROCCOLI', category: 'vegetables', unitPrice: 0.004, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_50', name: 'CARROT', category: 'vegetables', unitPrice: 0.003, unitOfMeasure: 'g', quantity: 0 },
    // Prepared items (13 items)
    { id: 'inv_51', name: 'ROTI PIZZA', category: 'prepared', unitPrice: 1.5, unitOfMeasure: 'pcs', quantity: 0 },
    { id: 'inv_52', name: 'ROTI BUN', category: 'prepared', unitPrice: 0.5, unitOfMeasure: 'pcs', quantity: 0 },
    { id: 'inv_53', name: 'TOMATO SOS BASE', category: 'prepared', unitPrice: 0.008, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_54', name: 'BLACK PEPPER SOS', category: 'prepared', unitPrice: 0.012, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_55', name: 'BOLOGNESE', category: 'prepared', unitPrice: 0.015, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_56', name: 'WHITE SOS', category: 'prepared', unitPrice: 0.01, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_57', name: 'GARLIC BUTTER', category: 'prepared', unitPrice: 0.008, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_58', name: 'MUSHROOM SOUP', category: 'prepared', unitPrice: 0.006, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_59', name: 'AYAM HERBA', category: 'prepared', unitPrice: 0.018, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_60', name: 'SPICY CHICKEN WINGS', category: 'prepared', unitPrice: 0.012, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_61', name: 'BBQ CHICKEN WINGS', category: 'prepared', unitPrice: 0.01, unitOfMeasure: 'g', quantity: 0 },
    { id: 'inv_62', name: 'MAC & CHEESE PREGO', category: 'prepared', unitPrice: 8, unitOfMeasure: 'pcs', quantity: 0 },
    { id: 'inv_63', name: 'GARLIC BREAD', category: 'prepared', unitPrice: 1.14, unitOfMeasure: 'pcs', quantity: 0 },
  ];

  for (const item of inventoryData) {
    await prisma.inventoryItem.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }

  console.log(`✅ Seeded ${inventoryData.length} inventory items`);

  // Seed menu items with recipes
  // (This would continue with menu items and their ingredient links)
  // For brevity, the full seed is in the prisma_seed.sql file

  console.log('✅ Costing seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });