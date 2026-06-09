// src/orders/dto/create-order.dto.ts
import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType, OrderSource, PaymentMethod } from '@prisma/client';

class OrderItemDto {
  @IsString()
  menuItemId: string;

  @IsString()
  name: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  totalPrice: number;

  @IsOptional()
  options?: any;

  @IsOptional()
  notes?: string;
}

export class CreateOrderDto {
  @IsString()
  orderNumber: string;

  @IsEnum(OrderType)
  type: OrderType;

  @IsOptional()
  @IsEnum(OrderSource)
  source?: OrderSource;

  @IsNumber()
  totalAmount: number;

  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  customerAddress?: string;

  @IsOptional()
  @IsString()
  tableId?: string;

  @IsOptional()
  @IsNumber()
  pax?: number;

  @IsOptional()
  @IsString()
  reservationTime?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}