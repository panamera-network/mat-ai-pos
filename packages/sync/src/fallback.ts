// packages/sync/src/fallback.ts
// QR Menu offline fallback — WhatsApp / Telegram / SMS

import type { OrderView } from '@mat-ai/types';

export interface FallbackResult {
  success: boolean;
  method: 'whatsapp' | 'telegram' | 'sms' | 'none';
  url?: string;
}

export async function sendFallback(
  order: OrderView,
  settings: {
    fallbackChannel: 'whatsapp' | 'telegram' | 'sms' | 'none';
    whatsappNumber: string;
    telegramBotToken?: string;
    telegramChatId?: string;
  }
): Promise<FallbackResult> {
  if (settings.fallbackChannel === 'none') {
    return { success: false, method: 'none' };
  }

  const text = formatOrderMessage(order);

  switch (settings.fallbackChannel) {
    case 'whatsapp':
      return sendWhatsApp(text, settings.whatsappNumber, order);
    case 'telegram':
      if (!settings.telegramBotToken || !settings.telegramChatId) {
        return { success: false, method: 'none' };
      }
      return sendTelegram(text, settings.telegramBotToken, settings.telegramChatId);
    case 'sms':
      // Future implementation
      return { success: false, method: 'sms' };
    default:
      return { success: false, method: 'none' };
  }
}

function formatOrderMessage(order: OrderView): string {
  const items = order.items.map(i => 
    `  ${i.quantity}x ${i.name} (RM${(i.quantity * i.unitPrice).toFixed(2)})`
  ).join('\n');

  return `🆕 *NEW QR ORDER*

📋 *Order:* ${order.orderNumber || order.id}
👤 *Name:* ${order.customerInfo?.name || 'N/A'}
📞 *Phone:* ${order.customerInfo?.phone || 'N/A'}
🍽️ *Type:* ${order.type?.replace('_', ' ')}

*Items:*
${items}

💰 *Total:* RM${(order.finalTotal ?? order.totalAmount ?? 0).toFixed(2)}
⏱️ *Time:* ${new Date().toLocaleString()}`;
}

function sendWhatsApp(text: string, number: string, _order: OrderView): FallbackResult {
  const encoded = encodeURIComponent(text);
  const url = `https://wa.me/${number}?text=${encoded}`;

  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }

  return { success: true, method: 'whatsapp', url };
}

async function sendTelegram(
  text: string, 
  botToken: string, 
  chatId: string
): Promise<FallbackResult> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        }),
      }
    );
    return { success: res.ok, method: 'telegram' };
  } catch {
    return { success: false, method: 'telegram' };
  }
}