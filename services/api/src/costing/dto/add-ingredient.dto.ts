import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class AddIngredientDto {
  @IsString()
  @IsOptional()
  inventoryItemId?: string;

  @IsString()
  @IsOptional()
  preCookId?: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  @IsOptional()
  unit?: string = 'g';
}