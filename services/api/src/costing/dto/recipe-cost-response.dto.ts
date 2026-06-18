export class RecipeCostResponseDto {
  menuItemId: string;
  menuItemName: string;
  totalCost: number;
  sellingPrice: number;
  profit: number;
  marginPercent: number;
  ingredients: IngredientCostDto[];
}

export class IngredientCostDto {
  inventoryItemId: string;
  inventoryItemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalCost: number;
}