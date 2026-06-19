import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsInt()
  points?: number;

  @IsOptional()
  @IsBoolean()
  isVip?: boolean;
}
