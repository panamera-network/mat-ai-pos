import { PartialType } from '@nestjs/mapped-types';
import { CreateMenuItemIngredientDto } from './create-menu-item-ingredient.dto';

export class UpdateMenuItemIngredientDto extends PartialType(CreateMenuItemIngredientDto) {}