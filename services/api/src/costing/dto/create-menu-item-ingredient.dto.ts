import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateMenuItemIngredientDto {
  @IsString()
  @IsNotEmpty()
  inventoryItemId: string;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  unit?: string = 'g';
}