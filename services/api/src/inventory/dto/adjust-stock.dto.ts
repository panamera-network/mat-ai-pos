import { IsString, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';

export class AdjustStockDto {
  @IsEnum(['open', 'in', 'out'])
  type: 'open' | 'in' | 'out';

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  staffId?: string;
}