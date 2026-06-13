// src/tables/dto/create-table.dto.ts
import { IsString, IsInt, IsEnum, IsOptional } from 'class-validator';
import { DiningTableStatus } from '@prisma/client';

export class CreateTableDto {
  @IsString()
  number: string;

  @IsInt()
  capacity: number;

  @IsOptional()
  @IsEnum(DiningTableStatus)
  status?: DiningTableStatus;
}