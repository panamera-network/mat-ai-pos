// src/orders/dto/create-order.dto.ts
import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderSource, OrderType } from '../../common/enums';  // ← guna ni

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
  @IsNumber()
  totalAmount: number;

  @IsOptional()
  @IsEnum(OrderSource)
  source?: OrderSource;

  @IsOptional()
  @IsEnum(OrderType)
  type?: OrderType;

  @IsOptional()
  @IsString()
  tableId?: string;

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
  @IsNumber()
  pax?: number;

  @IsOptional()
  @IsDateString()
  reservationTime?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}