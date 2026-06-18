import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateOutletDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}