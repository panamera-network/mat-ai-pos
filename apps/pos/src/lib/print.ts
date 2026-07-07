import type { Order, Receipt } from '@mat-ai/types';

const money = (value: number | string | undefined) => `RM${(Number(value) || 0).toFixed(2)}`;

const itemRows = (order: Pick<Order, 'items'>) =>
  order.items.map((item) => `
    <tr>
      <td>${item.quantity}x ${item.name}</td>
      <td style="text-align:right">${money(item.totalPrice)}</td>
    </tr>
    ${item.options?.length ? `<tr><td colspan="2" class="muted">${item.options.map((option) => option.name).join(', ')}</td></tr>` : ''}
    ${item.notes ? `<tr><td colspan="2" class="muted">${item.notes}</td></tr>` : ''}
  `).join('');

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

export function printOrderSlip(order: Order) {
  openPrintWindow(`Order ${order.orderNumber}`, `
    <h1>KITCHEN ORDER</h1>
    <div>Order: ${order.orderNumber || order.id}</div>
    <div>Type: ${order.type}</div>
    ${order.table?.number ? `<div>Table: ${order.table.number}</div>` : ''}
    ${order.customerInfo?.name ? `<div>Customer: ${order.customerInfo.name}</div>` : ''}
    <div class="line"></div>
    <table>${itemRows(order)}</table>
    ${order.notes ? `<div class="line"></div><div>${order.notes}</div>` : ''}
  `);
}

export function printBill(order: Order) {
  openPrintWindow(`Bill ${order.orderNumber}`, `
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
  `);
}

export function printReceipt(receipt: Receipt) {
  openPrintWindow(`Receipt ${receipt.receiptNo}`, `
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
  `);
}
