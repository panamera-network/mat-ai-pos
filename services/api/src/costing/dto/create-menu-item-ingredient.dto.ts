import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateMenuItemIngredientDto {
  @IsString()
  @IsOptional()
  inventoryItemId?: string;

  @IsString()
  @IsOptional()
  preCookId?: string;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  unit?: string = 'g';
}