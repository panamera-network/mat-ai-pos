import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class UpdateIngredientDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string;
}