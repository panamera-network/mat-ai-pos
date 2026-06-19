import { IsObject, IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class UpdateLandingPageContentDto {
  @IsObject()
  @IsOptional()
  content?: Record<string, any>;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}