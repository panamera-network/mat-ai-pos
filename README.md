# MAT.ai POS

Smart Restaurant Point of Sale System powered by AI.

## Apps

| App | Description | Port |
|-----|-------------|------|
| `@mat-ai/pos` | Cashier POS (Tablet) | 3000 |
| `@mat-ai/kitchen` | Kitchen Display | 3001 |
| `@mat-ai/admin` | Admin Dashboard (Tablet) | 3002 |
| `@mat-ai/qr-menu` | Customer QR Menu | 3003 |

## Quick Start

```bash
# Install dependencies
pnpm install

# Run POS app
pnpm pos:dev

# Run all apps
pnpm dev
```

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Database**: IndexedDB (Dexie.js)
- **Sync**: Supabase
- **Real-time**: WebSocket
- **Mobile**: Capacitor (PWA)

## Project Structure

```
mat-ai-pos/
├── apps/
│   ├── pos/          # Cashier POS
│   ├── kitchen/      # Kitchen Display
│   ├── admin/        # Admin Dashboard
│   └── qr-menu/      # QR Menu
├── packages/
│   ├── types/        # Shared TypeScript
│   ├── ui/           # Shared Components
│   ├── db/           # Database Layer
│   ├── ws/           # WebSocket
│   ├── sync/         # Cloud Sync
│   └── ai/           # AI Module (Future)
└── tooling/
    ├── eslint-config/
    ├── typescript-config/
    └── tailwind-config/
```

## License

MIT

## Github

https://github.com/panamera-network/mat-ai-pos