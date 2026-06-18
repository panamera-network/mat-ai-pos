import { IsNumber, IsOptional, IsEnum } from 'class-validator';

export enum PricingMethod {
  MARKUP = 'markup',
  MARGIN = 'margin',
  FOOD_COST = 'food_cost',
}

export class MarkupCalculatorDto {
  @IsNumber()
  cost: number;

  @IsEnum(PricingMethod)
  @IsOptional()
  method?: PricingMethod = PricingMethod.FOOD_COST;

  // For markup method: markup % on cost
  @IsNumber()
  @IsOptional()
  markupPercent?: number;

  // For margin method: target profit margin %
  @IsNumber()
  @IsOptional()
  targetMargin?: number;

  // For food_cost method: target food cost %
  @IsNumber()
  @IsOptional()
  targetFoodCostPercent?: number;

  // Alternative: input target price to see all metrics
  @IsNumber()
  @IsOptional()
  targetPrice?: number;
}

export class MarkupCalculatorResponseDto {
  cost: number;
  method: PricingMethod;

  // Input values
  markupPercent: number;
  targetMargin: number;
  targetFoodCostPercent: number;

  // Output price
  suggestedPrice: number;

  // All metrics (calculated from suggested price)
  profit: number;
  marginPercent: number;      // (price - cost) / price
  markupPercentActual: number; // (price - cost) / cost
  foodCostPercent: number;    // cost / price

  // For target price analysis
  targetPrice?: number;
  targetPriceAnalysis?: {
    marginPercent: number;
    markupPercent: number;
    foodCostPercent: number;
    profit: number;
  };
}