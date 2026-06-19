import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, IsDateString } from 'class-validator';
import { PromotionType, PromotionTarget } from '@prisma/client';

export class UpdatePromotionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(PromotionType)
  type?: PromotionType;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsNumber()
  minSpend?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(PromotionTarget)
  target?: PromotionTarget;

  @IsOptional()
  @IsNumber()
  priority?: number;
}
