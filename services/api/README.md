# @mat-ai/backend

NestJS backend for MAT.ai POS system.

## Stack
- **NestJS** — Framework
- **PostgreSQL** — Database
https://console.neon.tech/app/projects/restless-sky-08726925?database=neondb
- **Prisma** — ORM
- **Socket.IO** — Real-time sync
- **Redis** — Pub/sub (future scaling)

## Quick Start

### 1. Start infrastructure
```bash
docker-compose up -d
```

### 2. Install dependencies
```bash
pnpm install
```

### 3. Setup database
```bash
pnpm dlx prisma@6.6.0 migrate dev --name init
pnpm dlx prisma@6.6.0 generate
pnpm run db:seed

```

### 4. Run
```bash
# Development
pnpm start:dev

npx prisma@6.6.0 studio --schema=services/api/prisma/schema.prisma
/
cd services/api
npx prisma@6.6.0 studio --schema=prisma/schema.prisma

# Production
pnpm run build
pnpm run start:prod
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders` | Create order |
| GET | `/orders` | List all orders |
| GET | `/orders?status=PENDING` | Filter by status |
| GET | `/orders/:id` | Get single order |
| PATCH | `/orders/:id` | Update order |
| GET | `/orders/kitchen-queue` | Get KDS queue |
| PATCH | `/orders/items/:itemId/status` | Update item status |

## Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `joinRoom` | `"pos"` / `"kds"` / `"qr"` | Join app room |
| `order:create` | `CreateOrderDto` | Create new order |
| `order:update` | `{ id, updates }` | Update order |
| `order:itemStatus` | `{ itemId, status }` | Update item status |
| `sync:request` | `{ lastSync? }` | Request full sync |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `order:created` | `Order` | New order broadcast |
| `order:updated` | `Order` | Order updated |
| `pos:newOrder` | `Order` | New order for POS |
| `kds:newOrder` | `Order` | New order for KDS |
| `kds:orderPaid` | `Order` | Order paid → KDS |
| `pos:orderReady` | `Order` | Order ready → POS |
| `qr:orderReady` | `Order` | Order ready → QR |
| `sync:orders` | `Order[]` | Full order list |

## Architecture

```
QR Menu (:3003) ──┐
                  ├──► NestJS (:4000) ──► PostgreSQL
POS (:3000) ──────┤         │
                  │         └──► Socket.IO broadcast
KDS (:3001) ──────┘
```
