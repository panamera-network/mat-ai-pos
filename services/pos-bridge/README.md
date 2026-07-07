# MAT.ai POS Bridge

Local Node service that connects the browser POS app to kitchen display terminals.

## Why It Exists

The POS app runs in a browser and should not act as a WebSocket server. The bridge runs as a local Node process on the POS host machine or a small local server.

```text
POS browser -> HTTP POST -> POS Bridge -> WebSocket -> KDS tablets
```

## Run

```bash
pnpm bridge:dev
```

Default:

```text
http://localhost:8080
ws://localhost:8080
```

## Endpoints

```text
GET  /health
POST /orders/broadcast
POST /print
```

KDS clients connect over WebSocket:

```text
ws://<bridge-host>:8080
```

## Device Setup

Same machine testing:

```text
POS bridge host: localhost
KDS WebSocket: ws://localhost:8080
```

Real kitchen terminals:

```text
POS bridge host: <pos-host-lan-ip>
KDS WebSocket: ws://<pos-host-lan-ip>:8080
```

Make sure firewall rules allow inbound traffic on port `8080`.

## Events

The bridge broadcasts order payloads from POS to all connected KDS clients. It is intentionally lightweight and does not own order persistence; the API remains the source of truth.

## Printing

The bridge can forward print jobs to an ESC/POS network printer.

POS sends:

```text
POST /print
```

With printer settings:

```text
mode: escpos-network
host: <printer-lan-ip>
port: 9100
```

If the printer is unavailable, POS falls back to browser printing.
