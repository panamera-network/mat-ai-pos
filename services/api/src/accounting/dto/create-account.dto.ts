import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { AccountType } from '@prisma/client';

export class CreateAccountDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsEnum(AccountType)
  type: AccountType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  outletId?: string;
}
