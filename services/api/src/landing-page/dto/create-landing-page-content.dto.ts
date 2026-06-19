import { IsString, IsObject, IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class CreateLandingPageContentDto {
  @IsString()
  section: string;

  @IsString()
  key: string;

  @IsObject()
  content: Record<string, any>;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  outletId?: string;
}