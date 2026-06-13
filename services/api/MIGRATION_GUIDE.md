Prisma 7 Migration Guide — MAT.ai Backend
Overview
Upgrade dari Prisma 6.x ke 7.8.0 dengan hybrid setup (CommonJS NestJS + ESM Prisma config).
Breaking Changes Handled
1. datasource.url removed dari schema
Before: url = env("DATABASE_URL") dalam schema.prisma
After: Pindah ke prisma/prisma.config.mjs
2. Generator provider tukar
Before: provider = "prisma-client-js"
After: provider = "prisma-client"
3. Output directory explicit
Before: Client generate dalam node_modules/@prisma/client
After: Explicit output = "../src/generated/prisma"
4. $use middleware removed
Before: prisma.$use() dalam constructor
After: Client Extensions dengan $extends()
5. Driver adapter required
Before: new PrismaClient() — auto-connect via DATABASE_URL
After: new PrismaClient({ adapter: new PrismaPg(pool) })
Files Changed
New Files
prisma/prisma.config.mjs — Prisma 7 configuration
src/common/serializers/prisma.serializer.ts — Standalone serializer helper
Modified Files
prisma/schema.prisma — Remove url, update generator
src/prisma/prisma.service.ts — Adapter + Client Extensions setup
package.json — Update scripts & dependencies
Import Changes
Semua file yang import dari @prisma/client kena tukar:
TypeScript
// BEFORE
import { PrismaClient, OrderStatus, ItemStatus } from '@prisma/client';

// AFTER
import { PrismaClient, OrderStatus, ItemStatus } from '../generated/prisma/client';
Files yang kena update import:
src/prisma/prisma.service.ts ✅ (done)
src/prisma/prisma.module.ts — No change needed
src/orders/orders.service.ts — Check imports
src/orders/orders.controller.ts — Check imports
src/tables/tables.service.ts — Check imports
src/receipts/receipts.service.ts — Check imports
src/staff/staff.service.ts — Check imports
src/inventory/inventory.service.ts — Check imports
src/menu-items/menu-items.service.ts — Check imports
src/categories/categories.service.ts — Check imports
src/settings/settings.service.ts — Check imports
src/timecard/timecard.service.ts — Check imports
src/leave/leave.service.ts — Check imports
src/advance/advance.service.ts — Check imports
src/payroll/payroll.service.ts — Check imports
src/reports/reports.service.ts — Check imports
src/auth/auth.service.ts — Check imports
src/gateway/gateway.* — Check imports
prisma/seed.ts — Check imports
Installation Steps
bash
# 1. Install new dependencies
cd services/api
pnpm add dotenv @prisma/adapter-pg pg
pnpm add -D tsx

# 2. Replace files
# Copy generated files:
# - prisma/prisma.config.mjs
# - prisma/schema.prisma
# - src/prisma/prisma.service.ts
# - src/common/serializers/prisma.serializer.ts
# - package.json (merge scripts & deps)

# 3. Generate Prisma client
pnpm db:generate

# 4. Update all imports dalam codebase
# Find & replace: @prisma/client → ../generated/prisma/client (relative path)

# 5. Run migration
pnpm db:migrate
# atau kalau database kosong:
pnpm db:fresh
PrismaService Usage
TypeScript
// Dalam controllers/services, inject seperti biasa
@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    // Data dah auto-serialize (Decimal→number, Date→ISO string)
    return this.prisma.order.findMany();
  }
}
Standalone Serializer (kalau perlu manual serialize)
TypeScript
import { serializePrismaData } from '../common/serializers/prisma.serializer';

const rawData = await prisma.$queryRaw`...`;
const serialized = serializePrismaData(rawData);
Troubleshooting
Error: Cannot find module '../generated/prisma/client'
Run pnpm db:generate dulu
Check tsconfig.json include path cover src/generated
Error: The datasource property 'url' is no longer supported
Pastikan prisma.config.mjs wujud dan properly configured
Pastikan schema.prisma dah remove url line
Error: adapter is required
Pastikan PrismaPg adapter pass dalam constructor
Check pg package installed
Notes
Prisma 7.8.0 require explicit adapter untuk semua database connections
Client Extensions return new client instance, so PrismaService kena proxy methods
Serialization sekarang happen dalam Extensions layer, bukan middleware
Seed script kena guna tsx instead of ts-node untuk ESM compatibility