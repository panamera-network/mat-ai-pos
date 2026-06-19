import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum } from 'class-validator';
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
  customerId?: string;  // <-- NEW: link to existing customer

  @IsOptional()
  @IsString()
  tableId?: string;

  @IsOptional()
  @IsNumber()
  pax?: number;

  @IsOptional()
  reservationTime?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  outletId?: string;

  @IsOptional()
  @IsString()
  orderNumber?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
