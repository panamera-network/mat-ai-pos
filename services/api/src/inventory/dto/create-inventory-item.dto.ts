import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateInventoryItemDto {
  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  currentStock?: number;

  @IsOptional()
  @IsNumber()
  minStock?: number;

  @IsOptional()
  @IsNumber()
  costPerUnit?: number;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsString() 
  @IsOptional() 
  outletId?: string;

  // NEW FIELDS
  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @IsOptional()
  @IsString()
  unitOfMeasure?: string;

  @IsOptional()
  @IsNumber()
  openStock?: number;

  @IsOptional()
  @IsNumber()
  stockIn?: number;

  @IsOptional()
  @IsNumber()
  stockOut?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  packPrice?: number;
}