import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import { WebSocketServer } from 'ws';

const port = Number(process.env.POS_BRIDGE_PORT || process.env.PORT || 8080);
const stations = new Map();
let stationCounter = 0;

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

function createMessage(type, payload, stationId) {
  return {
    type,
    payload,
    timestamp: new Date().toISOString(),
    ...(stationId ? { stationId } : {}),
  };
}

function broadcast(message, filter) {
  for (const station of stations.values()) {
    if (filter && !filter(station)) continue;
    if (station.ws.readyState === station.ws.OPEN) {
      station.ws.send(JSON.stringify(message));
    }
  }
}

function getLocalAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((net) => net && net.family === 'IPv4' && !net.internal)
    .map((net) => net.address);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString('utf8');
  return body ? JSON.parse(body) : {};
}

function padRight(value, width) {
  return String(value || '').slice(0, width).padEnd(width, ' ');
}

function padLeft(value, width) {
  return String(value || '').slice(0, width).padStart(width, ' ');
}

function line(label, value, width = 42) {
  const cleanLabel = String(label || '');
  const cleanValue = String(value || '');
  const labelWidth = Math.max(1, width - cleanValue.length);
  return `${padRight(cleanLabel, labelWidth)}${cleanValue}\n`;
}

function escposDocument(document) {
  const width = 42;
  const chunks = [];
  chunks.push('\x1b@');
  chunks.push('\x1ba\x01');
  chunks.push('\x1b!\x10');
  chunks.push(`${document.title || 'MAT.ai POS'}\n`);
  chunks.push('\x1b!\x00');
  chunks.push('\x1ba\x00');
  chunks.push('-'.repeat(width) + '\n');

  for (const item of document.meta || []) {
    chunks.push(line(`${item.label}:`, item.value, width));
  }

  chunks.push('-'.repeat(width) + '\n');
  for (const item of document.items || []) {
    chunks.push(`${item.quantity || 1}x ${item.name || 'Item'}\n`);
    if (item.totalPrice !== undefined) chunks.push(line('', `RM${Number(item.totalPrice || 0).toFixed(2)}`, width));
    for (const option of item.options || []) chunks.push(`  + ${option}\n`);
    if (item.notes) chunks.push(`  Note: ${item.notes}\n`);
  }

  if (document.notes) {
    chunks.push('-'.repeat(width) + '\n');
    chunks.push(`${document.notes}\n`);
  }

  if (document.totals?.length) {
    chunks.push('-'.repeat(width) + '\n');
    for (const total of document.totals) {
      if (total.emphasis) chunks.push('\x1b!\x08');
      chunks.push(line(total.label, total.value, width));
      if (total.emphasis) chunks.push('\x1b!\x00');
    }
  }

  chunks.push('\n\n\n');
  chunks.push('\x1dV\x00');
  return Buffer.from(chunks.join(''), 'binary');
}

function printEscpos({ host, port }, document) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port: Number(port || 9100), timeout: 5000 }, () => {
      socket.write(escposDocument(document), () => socket.end());
    });

    socket.on('close', resolve);
    socket.on('timeout', () => {
      socket.destroy(new Error('Printer connection timed out'));
    });
    socket.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    json(res, 204, {});
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    json(res, 200, {
      ok: true,
      stations: stations.size,
      port,
      addresses: getLocalAddresses(),
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/orders/broadcast') {
    try {
      const { order } = await readJson(req);
      if (!order?.id) {
        json(res, 400, { ok: false, error: 'order.id is required' });
        return;
      }

      const message = createMessage('ORDER_CREATED', { order });
      broadcast(message);
      console.log(`[POS-BRIDGE] Broadcasted order ${order.orderNumber || order.id} to ${stations.size} station(s)`);
      json(res, 200, { ok: true, stations: stations.size });
    } catch (error) {
      json(res, 400, { ok: false, error: error instanceof Error ? error.message : 'Invalid request' });
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/print') {
    try {
      const { printer, document } = await readJson(req);
      if (printer?.mode !== 'escpos-network') {
        json(res, 400, { ok: false, error: 'Unsupported printer mode' });
        return;
      }
      if (!printer.host) {
        json(res, 400, { ok: false, error: 'printer.host is required' });
        return;
      }
      if (!document?.title) {
        json(res, 400, { ok: false, error: 'document.title is required' });
        return;
      }

      await printEscpos(printer, document);
      console.log(`[POS-BRIDGE] Printed ${document.type || 'document'} to ${printer.host}:${printer.port || 9100}`);
      json(res, 200, { ok: true });
    } catch (error) {
      json(res, 500, { ok: false, error: error instanceof Error ? error.message : 'Print failed' });
    }
    return;
  }

  json(res, 404, { ok: false, error: 'Not found' });
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  ws.on('message', (raw) => {
    try {
      const message = JSON.parse(raw.toString());

      if (message.type === 'STATION_REGISTER') {
        stationCounter += 1;
        const stationId = `station-${stationCounter}`;
        const station = {
          id: stationId,
          name: message.payload?.stationName || stationId,
          categories: message.payload?.categories || [],
          deviceType: message.payload?.deviceType || 'tablet',
          ws,
          connectedAt: new Date().toISOString(),
        };
        stations.delete(tempId);
        stations.set(stationId, station);
        ws.stationId = stationId;
        console.log(`[POS-BRIDGE] Station connected: ${station.name} (${stationId})`);
        return;
      }

      if (message.type === 'PING') {
        ws.send(JSON.stringify(createMessage('PONG', null)));
        return;
      }

      broadcast(message, (station) => station.ws !== ws);
    } catch (error) {
      console.error('[POS-BRIDGE] Invalid WS message:', error);
    }
  });

  ws.on('close', () => {
    const stationId = ws.stationId || tempId;
    const station = stations.get(stationId);
    if (station) console.log(`[POS-BRIDGE] Station disconnected: ${station.name} (${stationId})`);
    stations.delete(stationId);
    stations.delete(tempId);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`[POS-BRIDGE] Listening on port ${port}`);
  for (const address of getLocalAddresses()) {
    console.log(`[POS-BRIDGE] KDS URL: ws://${address}:${port}`);
    console.log(`[POS-BRIDGE] POS HTTP: http://${address}:${port}`);
  }
});
