import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum ProfitabilitySortBy {
  PROFIT = 'profit',
  MARGIN = 'margin',
  COST = 'cost',
  PRICE = 'price'
}

export enum ProfitabilitySortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

export class ProfitabilityQueryDto {
  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum(ProfitabilitySortBy)
  @IsOptional()
  sortBy?: ProfitabilitySortBy = ProfitabilitySortBy.MARGIN;

  @IsEnum(ProfitabilitySortOrder)
  @IsOptional()
  sortOrder?: ProfitabilitySortOrder = ProfitabilitySortOrder.DESC;

  @IsString()
  @IsOptional()
  search?: string;
}