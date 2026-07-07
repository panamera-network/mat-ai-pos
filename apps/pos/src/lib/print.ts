import type { Order, Receipt } from '@mat-ai/types';

const money = (value: number | string | undefined) => `RM${(Number(value) || 0).toFixed(2)}`;

type PrintMode = 'browser' | 'escpos-network';

interface PosPrintSettings {
  printerMode: PrintMode;
  printerHost: string;
  printerPort: number;
  bridgeHost: string;
  bridgePort: number;
}

interface PrintLineItem {
  name: string;
  quantity: number;
  totalPrice?: number;
  options?: string[];
  notes?: string;
}

interface PrintDocument {
  type: 'kitchen-order' | 'bill' | 'receipt';
  title: string;
  meta: Array<{ label: string; value: string }>;
  items: PrintLineItem[];
  totals?: Array<{ label: string; value: string; emphasis?: boolean }>;
  notes?: string;
}

const itemRows = (order: Pick<Order, 'items'>) =>
  order.items.map((item) => `
    <tr>
      <td>${item.quantity}x ${item.name}</td>
      <td style="text-align:right">${money(item.totalPrice)}</td>
    </tr>
    ${item.options?.length ? `<tr><td colspan="2" class="muted">${item.options.map((option) => option.name).join(', ')}</td></tr>` : ''}
    ${item.notes ? `<tr><td colspan="2" class="muted">${item.notes}</td></tr>` : ''}
  `).join('');

function getPrintSettings(): PosPrintSettings {
  try {
    const settings = JSON.parse(localStorage.getItem('mat-pos-settings') || '{}');
    return {
      printerMode: settings.printerMode || 'browser',
      printerHost: settings.printerHost || '',
      printerPort: Number(settings.printerPort || 9100),
      bridgeHost: settings.bridgeHost || settings.wsHost || 'localhost',
      bridgePort: Number(settings.bridgePort || settings.wsPort || 8080),
    };
  } catch {
    return {
      printerMode: 'browser',
      printerHost: '',
      printerPort: 9100,
      bridgeHost: 'localhost',
      bridgePort: 8080,
    };
  }
}

async function printViaBridge(document: PrintDocument): Promise<void> {
  const settings = getPrintSettings();
  if (!settings.printerHost) {
    throw new Error('Printer host is not configured');
  }

  const response = await fetch(`http://${settings.bridgeHost}:${settings.bridgePort}/print`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      printer: {
        mode: settings.printerMode,
        host: settings.printerHost,
        port: settings.printerPort,
      },
      document,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Bridge print failed: ${response.status} ${text}`);
  }
}

function orderItems(order: Order): PrintLineItem[] {
  return order.items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    totalPrice: item.totalPrice,
    options: item.options?.map((option) => option.name),
    notes: item.notes,
  }));
}

function receiptItems(receipt: Receipt): PrintLineItem[] {
  return receipt.itemsSnapshot.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    totalPrice: item.totalPrice,
    options: item.options?.map((option) => option.name),
    notes: item.notes,
  }));
}

async function printDocument(document: PrintDocument, browserPrint: () => void): Promise<void> {
  const settings = getPrintSettings();

  if (settings.printerMode === 'escpos-network') {
    try {
      await printViaBridge(document);
      return;
    } catch (error) {
      console.warn('[PRINT] ESC/POS print failed, falling back to browser print:', error);
      alert('Printer unavailable. Falling back to browser print.');
    }
  }

  browserPrint();
}

function openPrintWindow(title: string, body: string) {
  const printWindow = window.open('', '_blank', 'width=420,height=700');
  if (!printWindow) {
    alert('Print window blocked. Allow popups for this POS.');
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 16px; color: #111; }
          h1 { font-size: 18px; margin: 0 0 8px; }
          h2 { font-size: 14px; margin: 16px 0 8px; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 4px 0; font-size: 13px; vertical-align: top; }
          .muted { color: #666; font-size: 11px; padding-top: 0; }
          .line { border-top: 1px dashed #999; margin: 12px 0; }
          .total { font-weight: 700; font-size: 16px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>${body}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

export function printOrderSlip(order: Order): Promise<void> {
  const document: PrintDocument = {
    type: 'kitchen-order',
    title: 'KITCHEN ORDER',
    meta: [
      { label: 'Order', value: order.orderNumber || order.id },
      { label: 'Type', value: order.type },
      ...(order.table?.number ? [{ label: 'Table', value: order.table.number }] : []),
      ...(order.customerInfo?.name ? [{ label: 'Customer', value: order.customerInfo.name }] : []),
    ],
    items: orderItems(order),
    notes: order.notes,
  };

  return printDocument(document, () => openPrintWindow(`Order ${order.orderNumber}`, `
    <h1>KITCHEN ORDER</h1>
    <div>Order: ${order.orderNumber || order.id}</div>
    <div>Type: ${order.type}</div>
    ${order.table?.number ? `<div>Table: ${order.table.number}</div>` : ''}
    ${order.customerInfo?.name ? `<div>Customer: ${order.customerInfo.name}</div>` : ''}
    <div class="line"></div>
    <table>${itemRows(order)}</table>
    ${order.notes ? `<div class="line"></div><div>${order.notes}</div>` : ''}
  `));
}

export function printBill(order: Order): Promise<void> {
  const document: PrintDocument = {
    type: 'bill',
    title: 'BILL',
    meta: [
      { label: 'Order', value: order.orderNumber || order.id },
      { label: 'Type', value: order.type },
      ...(order.table?.number ? [{ label: 'Table', value: order.table.number }] : []),
      ...(order.customerInfo?.name ? [{ label: 'Customer', value: order.customerInfo.name }] : []),
    ],
    items: orderItems(order),
    totals: [
      { label: 'SST', value: money(order.taxAmount) },
      { label: 'Total', value: money(order.totalAmount), emphasis: true },
    ],
  };

  return printDocument(document, () => openPrintWindow(`Bill ${order.orderNumber}`, `
    <h1>BILL</h1>
    <div>Order: ${order.orderNumber || order.id}</div>
    <div>Type: ${order.type}</div>
    ${order.table?.number ? `<div>Table: ${order.table.number}</div>` : ''}
    ${order.customerInfo?.name ? `<div>Customer: ${order.customerInfo.name}</div>` : ''}
    <div class="line"></div>
    <table>${itemRows(order)}</table>
    <div class="line"></div>
    <table>
      <tr><td>SST</td><td style="text-align:right">${money(order.taxAmount)}</td></tr>
      <tr class="total"><td>Total</td><td style="text-align:right">${money(order.totalAmount)}</td></tr>
    </table>
  `));
}

export function printReceipt(receipt: Receipt): Promise<void> {
  const document: PrintDocument = {
    type: 'receipt',
    title: 'RECEIPT',
    meta: [
      { label: 'Receipt', value: receipt.receiptNo },
      { label: 'Order', value: receipt.orderId },
      { label: 'Payment', value: receipt.paymentMethod },
    ],
    items: receiptItems(receipt),
    totals: [
      { label: 'Paid', value: money(receipt.paidAmount) },
      ...(receipt.change ? [{ label: 'Change', value: money(receipt.change) }] : []),
      { label: 'Total', value: money(receipt.totalAmount), emphasis: true },
    ],
  };

  return printDocument(document, () => openPrintWindow(`Receipt ${receipt.receiptNo}`, `
    <h1>RECEIPT</h1>
    <div>Receipt: ${receipt.receiptNo}</div>
    <div>Order: ${receipt.orderId}</div>
    <div>Payment: ${receipt.paymentMethod}</div>
    <div class="line"></div>
    <table>${itemRows({ items: receipt.itemsSnapshot })}</table>
    <div class="line"></div>
    <table>
      <tr><td>Paid</td><td style="text-align:right">${money(receipt.paidAmount)}</td></tr>
      ${receipt.change ? `<tr><td>Change</td><td style="text-align:right">${money(receipt.change)}</td></tr>` : ''}
      <tr class="total"><td>Total</td><td style="text-align:right">${money(receipt.totalAmount)}</td></tr>
    </table>
  `));
}
