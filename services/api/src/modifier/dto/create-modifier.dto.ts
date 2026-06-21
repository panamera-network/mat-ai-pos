import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateModifierDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @IsString()
  @IsOptional()
  outletId?: string;
}