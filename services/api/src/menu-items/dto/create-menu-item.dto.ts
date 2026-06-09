// src/menu-items/dto/create-menu-item.dto.ts
import { IsString, IsNumber, IsOptional, IsInt, IsJSON } from 'class-validator';

export class CreateMenuItemDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsInt()
  stock?: number;

  @IsOptional()
  @IsInt()
  minStock?: number;

  @IsOptional()
  options?: any;
}