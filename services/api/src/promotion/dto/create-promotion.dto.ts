import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, IsDateString } from 'class-validator';
import { PromotionType, PromotionTarget } from '@prisma/client';

export class CreatePromotionDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PromotionType)
  type: PromotionType;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsNumber()
  minSpend?: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsString()
  outletId: string;

  @IsOptional()
  @IsEnum(PromotionTarget)
  target?: PromotionTarget;

  @IsOptional()
  @IsNumber()
  priority?: number;
}
