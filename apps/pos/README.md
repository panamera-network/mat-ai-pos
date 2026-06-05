# @mat-ai/pos

MAT.ai POS — Cashier application for iPad/Android. Handles dine-in, takeaway, delivery, reservation orders, payment processing, and kitchen display system (KDS) integration.

---

## Features

| Feature | Description |
|---------|-------------|
| 🔐 **PIN Login** | Secure staff authentication with role-based access |
| 🍽️ **4 Order Types** | Dine In, Takeaway, Delivery, Reservation |
| 🛒 **Cart Management** | Add items, modifiers, quantity adjust, remove |
| 💳 **Payment** | Cash, QR Pay, Card with change calculation |
| 📊 **Dashboard** | Live floor plan, active orders, QR order alerts |
| 🔔 **QR Orders** | Receive orders from QR Menu via WebSocket |
| 🖨️ **KDS Integration** | Broadcast orders to kitchen display |
| 📋 **Menu Editor** | Admin PIN-protected menu management |
| 📦 **Inventory** | Stock tracking with low-stock alerts |
| 🧾 **Receipt History** | Search, filter, print, email receipts |

---

## Tech Stack

- **React 18** + TypeScript
- **React Router** (SPA navigation)
- **Zustand** (state management with persistence)
- **Tailwind CSS** (mobile-first styling)
- **@mat-ai/ws** (WebSocket client/server)
- **@mat-ai/types** (shared TypeScript types)
- **Dexie** (IndexedDB for offline data)

---

## Project Structure

```
apps/pos/
├── src/
│   ├── App.tsx                 # Router + WS listener for QR orders
│   ├── main.tsx                # React root
│   ├── lib/
│   │   ├── ws.ts               # WS client (connect to KDS, broadcast orders)
│   │   └── types.ts            # POS-specific type extensions
│   ├── stores/
│   │   └── posStore.ts         # Zustand store (auth, orders, notifications)
│   └── pages/
│       ├── MainPage.tsx        # PIN login / time card
│       ├── Dashboard.tsx       # Floor plan, orders, stats, QR alerts
│       ├── POSPage.tsx         # Order creation (4 types, cart, modifiers)
│       ├── PaymentPage.tsx     # Payment processing (cash/QR/card)
│       ├── ReceiptHistoryPage.tsx # Receipt search, print, email
│       ├── MenuEditPage.tsx    # Menu management (admin PIN)
│       ├── InventoryPage.tsx   # Stock tracking
│       └── SettingsPage.tsx    # POS config, stations, tables
```

---

## Order Types

| Type | Flow | Fields |
|------|------|--------|
| **Dine In** | Select table → Add items → Save/Pay | Table number |
| **Takeaway** | Customer info → Add items → Save/Pay | Name*, Phone* |
| **Delivery** | Customer info → Add items → Save/Pay | Name*, Phone*, Address* |
| **Reservation** | Table + time → Customer info → Order now/later | Table*, Pax*, Time*, Name*, Phone* |

---

## WebSocket Integration

### POS as WS Client (to KDS)
```
POS (iPad) ──WS──► KDS (Kitchen Display)
  └── Broadcast: NEW_ORDER, ORDER_UPDATED
```

### POS as WS Server (from QR Menu)
```
QR Menu ──WS──► POS (receive orders)
  └── Shows notification + saves to active orders
```

### WS Events

| Direction | Event | Payload |
|-----------|-------|---------|
| POS → KDS | `NEW_ORDER` | POSOrder |
| POS → KDS | `ORDER_UPDATED` | POSOrder |
| QR → POS | `NEW_ORDER` | Order (from QR Menu) |

---

## Data Storage

All data stored in **localStorage** (Dexie for complex queries):

| Key | Data |
|-----|------|
| `mat-pos-menu-items` | Menu items |
| `mat-pos-categories` | Categories |
| `mat-pos-tables` | Table list + status |
| `mat-pos-active-orders` | Active orders |
| `mat-pos-receipts` | Completed receipts |
| `mat-pos-stations` | KDS/Printer stations |
| `mat-pos-inventory` | Stock items |
| `mat-ai-pos-storage` | Zustand persisted state |

---

## QR Order Reception

When QR Menu submits order:

1. POS receives `NEW_ORDER` via WS
2. Order saved to `mat-pos-active-orders`
3. Dashboard shows **pulse animation** on QR Orders button
4. Notification banner appears
5. Sound plays (if notification.mp3 exists)

```typescript
// App.tsx
wsClient.on('NEW_ORDER', (msg) => {
  const order = msg.payload;
  // Save order
  // Show notification
  // Play sound
});
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- KDS running (for kitchen display)

### Install

```bash
cd apps/pos
pnpm install
```

### Development

```bash
pnpm dev
# → http://localhost:3000
```

### Build

```bash
pnpm build
# → dist/ for Capacitor/Android/iOS
```

---

## Environment

No env variables needed. All config via Settings page:

| Setting | Default | Description |
|---------|---------|-------------|
| POS Name | MAT.ai POS | Display name |
| Tax Rate | 8% | SST percentage |
| Service Charge | 10% | Optional service fee |
| Currency | MYR | Display currency |
| WS URL | ws://localhost:4000 | KDS connection |

---

## Order Lifecycle

```
Create Order (POS/QR)
    │
    ▼
Status: active ──► Dashboard shows
    │
    ▼
Payment ──► Cash / QR / Card
    │
    ▼
Status: completed ──► Receipt generated
    │
    ▼
Table freed (if dine-in)
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| KDS not receiving orders | Check WS URL in Settings, ensure KDS is running |
| QR orders not appearing | Check WS connection, ensure same network |
| Menu items not showing | Go to Settings → Edit Menu to configure |
| Table stuck "occupied" | Settings → Table Management → Reset All |
| Low stock alert | Inventory page → check stock levels |

---

## License

MIT — Part of MAT.ai POS ecosystem.
