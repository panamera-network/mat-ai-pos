import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OrdersService } from '../orders/orders.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { UpdateOrderDto } from '../orders/dto/update-order.dto';
import { ItemStatus } from '../common/enums';

// Room names for targeted broadcasts
const ROOMS = {
  POS: 'pos',
  KDS: 'kds',
  QR: 'qr',
  ALL: 'all',
} as const;

@WebSocketGateway({
  cors: {
    origin: (requestOrigin, callback) => {
      const allowed = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3003'];
      if (!requestOrigin || allowed.includes(requestOrigin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  },
  namespace: '/',
})
export class OrdersGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly ordersService: OrdersService) {}

  afterInit() {
    console.log('📡 Socket.IO Gateway initialized');
  }

  handleConnection(client: Socket) {
    console.log(`🟢 Client connected: ${client.id}`);
    // Auto-join 'all' room
    client.join(ROOMS.ALL);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔴 Client disconnected: ${client.id}`);
  }

  // ─── Room Management ───

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(room);
    console.log(`👥 ${client.id} joined room: ${room}`);
    return { success: true, room };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(room);
    return { success: true, room };
  }

  // ─── Order Events ───

  @SubscribeMessage('order:create')
  async handleCreateOrder(@MessageBody() dto: CreateOrderDto) {
    const order = await this.ordersService.create(dto);

    // Broadcast to all connected apps
    this.server.to(ROOMS.ALL).emit('order:created', order);

    // Targeted: POS gets notification
    this.server.to(ROOMS.POS).emit('pos:newOrder', order);

    // Targeted: KDS gets notification if paid or preparing
    if (['PAID', 'PREPARING'].includes(order.status)) {
      this.server.to(ROOMS.KDS).emit('kds:newOrder', order);
    }

    return { success: true, order };
  }

  @SubscribeMessage('order:update')
  async handleUpdateOrder(
    @MessageBody() payload: { id: string; updates: UpdateOrderDto },
  ) {
    const order = await this.ordersService.update(payload.id, payload.updates);

    // Broadcast update
    this.server.to(ROOMS.ALL).emit('order:updated', order);

    // Status-specific broadcasts
    if (payload.updates.status === 'PAID') {
      this.server.to(ROOMS.KDS).emit('kds:orderPaid', order);
    }
    if (payload.updates.status === 'READY') {
      this.server.to(ROOMS.POS).emit('pos:orderReady', order);
      this.server.to(ROOMS.QR).emit('qr:orderReady', order);
    }
    if (payload.updates.status === 'SERVED') {
      this.server.to(ROOMS.ALL).emit('order:served', order);
    }

    return { success: true, order };
  }

  @SubscribeMessage('order:itemStatus')
  async handleItemStatus(
    @MessageBody() payload: { itemId: string; status: string },
  ) {
    const item = await this.ordersService.updateItemStatus(
      payload.itemId, 
      payload.status as ItemStatus
    );
    // Fetch full order to broadcast
    const order = await this.ordersService.findOne(item.orderId);
    this.server.to(ROOMS.ALL).emit('order:updated', order);
    this.server.to(ROOMS.KDS).emit('kds:itemUpdated', { item, order });

    return { success: true, item, order };
  }

  // ─── Sync Events ───

  @SubscribeMessage('sync:request')
  async handleSyncRequest(
    @MessageBody() payload: { lastSync?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const orders = await this.ordersService.findAll();
    client.emit('sync:orders', orders);
    return { success: true, count: orders.length };
  }

  // ─── Helper: Emit from other services ───

  broadcastToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  broadcastAll(event: string, data: any) {
    this.server.to(ROOMS.ALL).emit(event, data);
  }
}
