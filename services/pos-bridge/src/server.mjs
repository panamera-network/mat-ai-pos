import http from 'node:http';
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
        console.log(`[POS-BRIDGE] KDS connected: ${station.name} (${stationId})`);
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
    if (station) console.log(`[POS-BRIDGE] KDS disconnected: ${station.name} (${stationId})`);
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
