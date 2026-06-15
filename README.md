# MAT.ai POS

Smart Restaurant Point of Sale System powered by AI.

## Apps

| App | Description | Port | Stack |
|-----|-------------|------|-------|
| `@mat-ai/pos` | Cashier POS (Tablet) | 3000 | React 18 + Vite + Dexie (offline) |
| `@mat-ai/kitchen` | Kitchen Display | 3001 | React 18 + Vite + WebSocket |
| `@mat-ai/admin` | Admin Dashboard (Tablet) | 3002 | React 18 + Vite + Prisma/Supabase |
| `@mat-ai/qr-menu` | Customer QR Menu | 3003 | React 18 + Vite |
| `@mat-ai/api` | Backend API | 4000 | Node.js + Prisma + Supabase |

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Offline DB**: IndexedDB (Dexie.js) — POS & Kitchen
- **Cloud DB**: PostgreSQL via Prisma + Supabase — Admin
- **Real-time**: WebSocket (Kitchen ↔ POS)
- **Sync**: Supabase (cloud backup & multi-device)
- **Mobile**: Capacitor (PWA)

## Project Structure


```
mat-ai-pos/
├── apps/
│   ├── pos/          # Cashier POS (offline-first)
│   ├── kitchen/      # Kitchen Display (real-time)
│   ├── admin/        # Admin Dashboard (cloud)
│   └── qr-menu/      # Customer QR Menu
├── services/
│   └── api/          # NestJS backend API
│       ├── prisma/   # Prisma schema & migrations
│       ├── src/      # API modules & endpoints
│       ├── dist/     # Build output
│       ├── docker-compose.yml
│       └── sync-client.ts
├── packages/
│   ├── types/        # Shared TypeScript definitions
│   ├── ui/           # Shared UI components
│   ├── db/           # Database layer (Dexie + Prisma adapters)
│   ├── ws/           # WebSocket client/server
│   ├── sync/         # Cloud sync logic
│   ├── backoffice/   # backoffice 
│   └── ai/           # AI module (planned)
└── tooling/
    ├── eslint-config/
    ├── typescript-config/
    └── tailwind-config/

```
## Quick Start

```bash
# Install dependencies
pnpm install

# Run individual apps
pnpm pos:dev      # POS only
pnpm kitchen:dev  # Kitchen only
pnpm admin:dev    # Admin only
pnpm api:dev      # or: cd services/api && pnpm start:dev

# Run all apps + API
pnpm dev

Environment Setup

Copy .env.example to .env and configure:
VITE_SUPABASE_URL / VITE_SUPABASE_KEY — cloud sync
DATABASE_URL — Prisma connection (Admin API)
WS_PORT — WebSocket server (default: 4001)


## License

MIT

## Github

https://github.com/panamera-network/mat-ai-pos

## Git Workflow

```bash
# Check status
cd D:\mat-ai-pos
git status

# Stage and commit
git add .
git commit -m "type: description"

# Push
git push origin main
# atau
git push origin master

Buka GitHub repo, check files ada ke tak

❓ Kalau Belum Setup Remote

# Check remote
git remote -v

# Kalau takde, add:
git remote add origin https://github.com/YOUR_USERNAME/mat-ai-pos.git

# Then push:
git push -u origin main

One-Liner (PowerShell)

cd D:\mat-ai-pos; git add .; git commit -m ["feat: full backend construction";] git push origin main