import { IsString, IsBoolean, IsOptional, IsObject } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsObject()
  permissions: Record<string, boolean>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}