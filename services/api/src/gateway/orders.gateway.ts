// src/gateway/orders.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { forwardRef, Inject } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { UpdateOrderDto } from '../orders/dto/update-order.dto';
import { ItemStatus } from '../common/enums';

const ROOMS = {
  POS: 'pos',
  KDS: 'kds',
  QR: 'qr',
  ALL: 'all',
} as const;

@WebSocketGateway({
  cors: { origin: true, credentials: true },
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private rooms = new Map<string, Set<string>>();

  constructor(
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
  ) {}

  afterInit() {
    console.log('📡 Socket.IO Gateway initialized');
  }

  handleConnection(client: Socket) {
    console.log(`🔌 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 Client disconnected: ${client.id}`);
    this.rooms.forEach((clients) => clients.delete(client.id));
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, room: string) {
    client.join(room);
    if (!this.rooms.has(room)) this.rooms.set(room, new Set());
    this.rooms.get(room).add(client.id);
    console.log(`👤 Client ${client.id} joined room: ${room}`);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: Socket, room: string) {
    client.leave(room);
    this.rooms.get(room)?.delete(client.id);
    console.log(`👤 Client ${client.id} left room: ${room}`);
  }

  // Broadcast methods
  broadcastNewOrder(order: any) {
    this.server.to(ROOMS.POS).emit('pos:newOrder', order);
    this.server.to(ROOMS.KDS).emit('kds:newOrder', order);
    console.log(`📢 Broadcasted new order: ${order.orderNumber}`);
  }

  broadcastOrderReady(order: any) {
    this.server.to(ROOMS.POS).emit('pos:orderReady', order);
    this.server.to(ROOMS.QR).emit('qr:orderReady', order);
    console.log(`📢 Broadcasted order ready: ${order.orderNumber}`);
  }

  broadcastOrderUpdated(order: any) {
    this.server.to(ROOMS.ALL).emit('order:updated', order);
  }

  // Socket events
  @SubscribeMessage('order:create')
  async handleCreateOrder(@MessageBody() dto: CreateOrderDto) {
    const order = await this.ordersService.create(dto);
    this.server.to(ROOMS.ALL).emit('order:created', order);
    this.server.to(ROOMS.POS).emit('pos:newOrder', order);
    if (['PAID', 'PREPARING'].includes(order.status)) {
      this.server.to(ROOMS.KDS).emit('kds:newOrder', order);
    }
    return { success: true, order };
  }

  @SubscribeMessage('order:update')
  async handleUpdateOrder(@MessageBody() payload: { id: string; updates: UpdateOrderDto }) {
    const order = await this.ordersService.update(payload.id, payload.updates);
    this.server.to(ROOMS.ALL).emit('order:updated', order);
    if (payload.updates.status === 'PAID') {
      this.server.to(ROOMS.KDS).emit('kds:orderPaid', order);
    }
    if (payload.updates.status === 'READY') {
      this.server.to(ROOMS.POS).emit('pos:orderReady', order);
      this.server.to(ROOMS.QR).emit('qr:orderReady', order);
    }
    return { success: true, order };
  }

  @SubscribeMessage('order:itemStatus')
  async handleItemStatus(@MessageBody() payload: { itemId: string; status: string }) {
    const item = await this.ordersService.updateItemStatus(payload.itemId, payload.status as ItemStatus);
    const order = await this.ordersService.findOne(item.orderId);
    this.server.to(ROOMS.ALL).emit('order:updated', order);
    this.server.to(ROOMS.KDS).emit('kds:itemUpdated', { item, order });
    return { success: true, item, order };
  }

  @SubscribeMessage('sync:request')
  async handleSyncRequest(@ConnectedSocket() client: Socket) {
    const orders = await this.ordersService.findAll();
    client.emit('sync:orders', orders);
    return { success: true, count: orders.length };
  }
}