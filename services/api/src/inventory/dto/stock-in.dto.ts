// src/inventory/dto/stock-in.dto.ts
import { IsNumber, IsString, IsOptional } from 'class-validator';

export class StockInDto {
  @IsNumber()
  qty: number;

  @IsString()
  staffId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}