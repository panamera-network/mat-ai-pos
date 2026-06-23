
// ============================================
// ADD TO EXISTING seed.ts — After outlet creation
// ============================================

// After creating outlets, auto-generate preset COA for each outlet
async function seedPresetCoa(prisma: PrismaClient) {
  const outlets = await prisma.outlet.findMany();

  for (const outlet of outlets) {
    const existingAccounts = await prisma.account.count({
      where: { outletId: outlet.id },
    });

    if (existingAccounts === 0) {
      console.log(`\n📝 Creating preset COA for outlet: ${outlet.name}`);

      const { PRESET_COA } = await import('../src/accounting/preset-coa');

      // First pass: parent accounts
      for (const acc of PRESET_COA.filter(a => !a.parentCode)) {
        await prisma.account.create({
          data: {
            code: acc.code,
            name: acc.name,
            type: acc.type as AccountType,
            description: acc.description,
            outletId: outlet.id,
            isPreset: true,
          },
        });
      }

      // Second pass: child accounts
      for (const acc of PRESET_COA.filter(a => a.parentCode)) {
        const parent = await prisma.account.findFirst({
          where: { code: acc.parentCode, outletId: outlet.id },
        });

        await prisma.account.create({
          data: {
            code: acc.code,
            name: acc.name,
            type: acc.type as AccountType,
            description: acc.description,
            outletId: outlet.id,
            parentId: parent?.id,
            isPreset: true,
          },
        });
      }

      console.log(`✅ Preset COA created for ${outlet.name}`);
    }
  }
}

// Call this function in your main seed() function after outlet creation
// await seedPresetCoa(prisma);
