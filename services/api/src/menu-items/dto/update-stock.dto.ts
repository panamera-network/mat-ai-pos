// src/menu-items/dto/update-stock.dto.ts
import { IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';

export enum StockUpdateType {
  IN = 'in',
  OUT = 'out',
  ADJUST = 'adjust',
}

export class UpdateStockDto {
  @IsNumber()
  quantity: number;

  @IsEnum(StockUpdateType)
  type: StockUpdateType;

  @IsOptional()
  @IsString()
  staffId?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}