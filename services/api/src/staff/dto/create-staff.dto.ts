import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString } from 'class-validator';

export class CreateStaffDto {
  @IsString()
  name: string;

  @IsString()
  pin: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsBoolean()
  isSuperAdmin?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsString()
  employmentType: string;

  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @IsOptional()
  @IsNumber()
  monthlySalary?: number;

  @IsOptional()
  @IsDateString()
  joinDate?: string;

  @IsOptional()
  @IsNumber()
  customEpfRate?: number;

  @IsOptional()
  @IsNumber()
  customSocsoRate?: number;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  outletId?: string;
}