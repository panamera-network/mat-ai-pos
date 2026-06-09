// lib/sync.ts
// MAT.ai QR Menu Sync Engine
// Handles: POS online check, WS submit, Telegram fallback

import { createWSClient, MATaiWSClient } from '@mat-ai/ws';
import type { OrderView } from '@mat-ai/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';
const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || '';

// Keep one WS connection, don't create/destroy per submit
let wsClient: MATaiWSClient | null = null;
let wsConnected = false;

/**
 * Initialize persistent WS connection
 */
export function initSync(room: string = 'qr'): () => void {
  if (wsClient?.isConnected()) return () => {};

  wsClient = createWSClient({
    url: WS_URL,
    stationName: 'QR-Menu',
    categories: [],
    deviceType: 'tablet',
    onConnect: () => { wsConnected = true; console.log('[Sync] WS connected'); },
    onDisconnect: () => { wsConnected = false; console.log('[Sync] WS disconnected'); },
    onError: (err) => { console.error('[Sync] WS error:', err); },
  });

  wsClient.connect();

  // Return cleanup
  return () => {
    wsClient?.disconnect();
    wsClient = null;
  };
}

/**
 * Check if POS is online (ping API or WS)
 */
export async function isPosOnline(): Promise<boolean> {
  // Try API first
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${API_URL}/health`, { 
      signal: controller.signal,
      mode: 'no-cors' // Handle CORS for local network
    });
    clearTimeout(timeout);
    if (res.ok || res.status === 0) return true; // status 0 = no-cors success
  } catch {
    // API down, check WS
  }

  // Fallback: check WS connection
  return wsConnected && wsClient?.isConnected() === true;
}

/**
 * Submit order via WebSocket to POS
 */
export async function submitOrderViaWS(order: OrderView): Promise<boolean> {
  if (!wsClient || !wsClient.isConnected()) {
    // Try reconnect
    initSync();
    await new Promise(r => setTimeout(r, 1000));
    if (!wsClient?.isConnected()) return false;
  }

  wsClient.send({
    type: 'NEW_ORDER',
    payload: order,
    timestamp: new Date().toISOString(),
    stationName: 'QR-Menu',
  } as any);

  return true;
}

/**
 * Submit order via Telegram (fallback when POS offline)
 */
export async function submitOrderViaTelegram(order: OrderView): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('[Sync] Telegram not configured');
    return false;
  }

  // FIXED: Use Prisma-aligned field names
  const itemsText = order.items.map(i => 
    `  ${i.quantity}x ${i.name} (RM${(i.quantity * i.unitPrice).toFixed(2)})`
  ).join('\n');

  const total = order.finalTotal ?? order.totalAmount ?? 0;

  const text = `🆕 <b>NEW QR ORDER</b>

📋 <b>Order:</b> ${order.orderNumber || order.id}
👤 <b>Name:</b> ${order.customerName || 'N/A'}
📞 <b>Phone:</b> ${order.customerPhone || 'N/A'}
🍽️ <b>Type:</b> ${order.type?.replace('_', ' ')}
${order.tableNumber ? `🪑 <b>Table:</b> ${order.tableNumber}\n` : ''}
${order.reservationTime ? `⏰ <b>Time:</b> ${new Date(order.reservationTime).toLocaleString()}\n` : ''}
${order.customerAddress ? `📍 <b>Address:</b> ${order.customerAddress}\n` : ''}
${order.notes ? `📝 <b>Notes:</b> ${order.notes}\n` : ''}
<b>Items:</b>
${itemsText}

💰 <b>Total:</b> RM${total.toFixed(2)}
⏱️ <b>Time:</b> ${new Date().toLocaleString()}

⚠️ POS is OFFLINE - Please key in manually`;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'HTML',
        }),
      }
    );
    return res.ok;
  } catch (err) {
    console.error('[Sync] Telegram failed:', err);
    return false;
  }
}

/**
 * Main submit function - tries WS first, falls back to Telegram
 */
export async function submitOrder(order: OrderView): Promise<{
  success: boolean;
  method: 'ws' | 'telegram' | 'failed';
}> {
  // Try WS first
  const online = await isPosOnline();

  if (online) {
    const wsSuccess = await submitOrderViaWS(order);
    if (wsSuccess) return { success: true, method: 'ws' };
  }

  // Fallback to Telegram
  const tgSuccess = await submitOrderViaTelegram(order);
  if (tgSuccess) return { success: true, method: 'telegram' };

  // Complete failure - save to local queue for retry
  saveToLocalQueue(order);
  return { success: false, method: 'failed' };
}

/**
 * Save order to local queue for retry
 */
function saveToLocalQueue(order: OrderView): void {
  const queue = JSON.parse(localStorage.getItem('mat-qr-pending-orders') || '[]');
  queue.push({ ...order, _queuedAt: new Date().toISOString() });
  localStorage.setItem('mat-qr-pending-orders', JSON.stringify(queue));
}

/**
 * Fetch menu availability from POS
 */
export async function fetchMenuAvailability(): Promise<Record<string, boolean>> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_URL}/menu/availability`, { 
      signal: controller.signal 
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    return data.items || {};
  } catch {
    // Return empty = all available (fail open)
    return {};
  }
}

/**
 * Poll availability periodically
 */
export function startAvailabilityPolling(
  callback: (availability: Record<string, boolean>) => void,
  intervalMs: number = 30 * 60 * 1000 // 30 minutes
): () => void {
  // Fetch immediately
  fetchMenuAvailability().then(callback);

  // Then poll
  const interval = setInterval(() => {
    fetchMenuAvailability().then(callback);
  }, intervalMs);

  return () => clearInterval(interval);
}

export { wsClient, wsConnected };
