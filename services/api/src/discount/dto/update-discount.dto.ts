import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, IsArray, IsDateString } from 'class-validator';
import { DiscountType } from '@prisma/client';

export class UpdateDiscountDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(DiscountType)
  @IsOptional()
  type?: DiscountType;

  @IsNumber()
  @IsOptional()
  value?: number;

  @IsNumber()
  @IsOptional()
  minSpend?: number;

  @IsNumber()
  @IsOptional()
  maxDiscount?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableItems?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableCategories?: string[];
}