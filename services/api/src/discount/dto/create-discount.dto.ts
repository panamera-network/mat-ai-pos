import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, IsArray, IsDateString } from 'class-validator';
import { DiscountType } from '@prisma/client';

export class CreateDiscountDto {
  @IsString()
  name: string;

  @IsEnum(DiscountType)
  type: DiscountType;

  @IsNumber()
  value: number;

  @IsNumber()
  @IsOptional()
  minSpend?: number;

  @IsNumber()
  @IsOptional()
  maxDiscount?: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  outletId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableItems?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableCategories?: string[];
}