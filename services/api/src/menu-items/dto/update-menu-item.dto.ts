// src/menu-items/dto/update-menu-item.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateMenuItemDto } from './create-menu-item.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateMenuItemDto extends PartialType(CreateMenuItemDto) {
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}