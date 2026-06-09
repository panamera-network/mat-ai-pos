// src/staff/dto/create-staff.dto.ts
import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { Role, EmploymentType } from '@prisma/client';

export class CreateStaffDto {
  @IsString()
  name: string;

  @IsString()
  pin: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

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
}