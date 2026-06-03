//services/api/src/orders/dto/update-order.dto.ts
import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { OrderStatus, PaymentMethod } from '../../common/enums';
import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsNumber()
  paidAmount?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;
}
