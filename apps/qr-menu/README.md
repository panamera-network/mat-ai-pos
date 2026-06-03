# @mat-ai/qr-menu

QR-based customer ordering app for MAT.ai POS. Customers scan a QR code, select order type, browse menu with live availability, and submit orders directly to POS or via Telegram fallback.

---

## Features

| Feature | Description |
|---------|-------------|
| 📱 **Scan & Order** | Customers scan table QR code |
| 🍽️ **4 Order Types** | Dine In, Pickup, Delivery, Reservation |
| 📋 **Smart Forms** | Dynamic fields based on order type |
| 🛒 **Cart Management** | Add/remove items, adjust quantity, select modifiers |
| ✅ **Availability Check** | Real-time stock status from POS |
| 📤 **Smart Submit** | WS to POS (online) / Telegram (offline) |
| 📊 **Track Status** | Live order status: Sent → Preparing → Ready → Served |
| 🧾 **Digital Receipt** | View, share, and print receipt |
| 🔔 **Real-time Updates** | WS + polling fallback |

---

## Tech Stack

- **React 18** + TypeScript
- **React Router** (SPA navigation)
- **Tailwind CSS** (mobile-first styling)
- **@mat-ai/ws** (WebSocket client)
- **@mat-ai/types** (shared TypeScript types)

---

## Project Structure
apps/qr-menu/
├── .env.example                # Environment variables template
├── src/
│   ├── main.tsx                # React root renderer
│   ├── App.tsx                 # Router setup (5 routes)
│   ├── vite-env.d.ts           # Vite env types
│   ├── lib/
│   │   └── sync.ts             # Sync engine (WS + Telegram fallback)
│   └── pages/
│       ├── OrderTypePage.tsx   # Order type selection
│       ├── MenuPage.tsx        # Menu browsing + availability
│       ├── CartPage.tsx        # Cart + dynamic forms + submit
│       ├── OrderStatusPage.tsx # Status tracking
│       └── ReceiptPage.tsx     # Digital receipt


---

## Order Flow
Customer Scan QR
│
▼
Order Type Selection (Dine In / Pickup / Delivery / Reservation)
│
├──► Dine In ──► Table + Pax + Notes
├──► Pickup ───► Name* + Phone* + Notes
├──► Delivery ─► Name* + Phone* + Address* + Notes
└──► Reservation ─► Table + Pax + Time* + Notes + Order Now/Later
│
▼
Browse Menu (with availability, sold out = greyed)
│
▼
Cart Review + Form Validation
│
▼
Submit ──► Check POS Online?
├──► YES ──► WebSocket ──► POS ──► "Order sent!"
└──► NO ──► Telegram Bot ──► Cashier ──► "Sent to cashier"
│
▼
Track Status (polling 5s + WS)
│
▼
Digital Receipt

---

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env

| Variable                  | Required | Description                                    |
| ------------------------- | -------- | ---------------------------------------------- |
| `VITE_API_URL`            | Yes      | POS API URL (e.g. `http://192.168.1.100:4000`) |
| `VITE_WS_URL`             | Yes      | WebSocket URL (e.g. `ws://192.168.1.100:8080`) |
| `VITE_TELEGRAM_BOT_TOKEN` | No       | Telegram bot token (fallback)                  |
| `VITE_TELEGRAM_CHAT_ID`   | No       | Telegram chat ID (fallback)                    |

Getting Started

Prerequisites
Node.js 18+
pnpm (or npm/yarn)
POS app running (for WS/API connection)

Install

cd apps/qr-menu
pnpm install

Development

cp .env.example .env
# Edit .env with your POS IP address
pnpm dev
# → http://localhost:3003

Build for Production

pnpm build
# → dist/ folder for Vercel deploy

POS Requirements

QR Menu expects these from POS:
| Endpoint             | Method | Response                                 |
| -------------------- | ------ | ---------------------------------------- |
| `/health`            | GET    | `{ "status": "ok" }`                     |
| `/menu/availability` | GET    | `{ "items": { "menu-id": true/false } }` |

WebSocket Events:

NEW_ORDER — POS receives order from QR Menu

Order Type Details
| Type        | Required Fields                         | Order Timing    |
| ----------- | --------------------------------------- | --------------- |
| Dine In     | Name\*, Phone\*, Table\*                | Now             |
| Pickup      | Name\*, Phone\*                         | Now             |
| Delivery    | Name\*, Phone\*, Address\*              | Now             |
| Reservation | Name\*, Phone\*, Table\*, Pax\*, Time\* | Now / @ Counter |
* = required

Telegram Fallback

When POS is offline, orders send to Telegram:
🆕 NEW QR ORDER

📋 Order: Q001
👤 Name: Ahmad
📞 Phone: 012-3456789
🍽️ Type: DINE IN
🪑 Table: T01

Items:
  2x Nasi Lemak (RM17.00)
  1x Teh Tarik (RM3.50)

💰 Total: RM22.14
⏱️ Time: 3/6/2026, 10:30 AM

⚠️ POS is OFFLINE - Please key in manually

Setup:

Create bot with @BotFather
Get chat ID from @userinfobot
Fill in .env

Deploy to Vercel
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

Troubleshooting
| Problem                | Solution                                   |
| ---------------------- | ------------------------------------------ |
| "No Menu Available"    | POS must save menu to `localStorage` first |
| Order not reaching POS | Check `VITE_WS_URL` matches POS IP         |
| Telegram not working   | Verify bot token and chat ID               |
| Sold out not updating  | Check POS `/menu/availability` endpoint    |

License
MIT — Part of MAT.ai POS ecosystem.