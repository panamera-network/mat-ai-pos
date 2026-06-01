# @mat-ai/kitchen

Kitchen Display System (KDS) for MAT.ai POS

## Features

- **Real-time Orders**: Receive orders from POS via WebSocket
- **Kanban Board**: Card-based layout (like reference image)
- **Timer Colors**: Green (0-15min) → Yellow (15-25min) → Red (25min+)
- **Item Tracking**: Click item to mark done (✓)
- **Order Done**: Click Done button when all items complete
- **Sound Alert**: Beep on new order
- **Order History**: View completed orders
- **Settings**: IP config, station categories, sound, reset memory
- **Mock Mode**: Demo with sample orders (no POS needed)

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | KitchenDisplay | Main KDS board |
| `/history` | OrderHistory | Completed orders |
| `/settings` | Settings | Config & reset |

## Quick Start

```bash
# From repo root
pnpm install
pnpm kitchen:dev    # Runs on port 3001
```

## Mock Mode

Set `USE_MOCK = true` in `src/pages/KitchenDisplay.tsx` to run without POS server.

## WebSocket Protocol

See `@mat-ai/ws` package for message types.

### Connection Flow

1. KDS connects to `ws://{posIp}:{posPort}`
2. Sends `STATION_REGISTER` with name & categories
3. Receives `ORDER_CREATED` when POS submits order
4. Sends `ITEM_DONE` when item marked complete
5. Sends `ORDER_DONE` when order complete

## Tech Stack

- React 18 + Vite + TypeScript
- Tailwind CSS
- Zustand (state)
- WebSocket (real-time)
- localStorage (history & settings)
