import { IsNumber, IsString, IsOptional, Min, IsEnum } from 'class-validator';

export type PricingMethod = 'food_cost' | 'markup' | 'margin' | 'target_price';

export class CalculatorDto {
  @IsNumber()
  @Min(0)
  cost: number;

  @IsString()
  @IsEnum(['food_cost', 'markup', 'margin', 'target_price'])
  method: PricingMethod = 'markup';

  @IsNumber()
  @IsOptional()
  @Min(0)
  markupPercent?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  targetMargin?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  targetFoodCostPercent?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  targetPrice?: number;
}