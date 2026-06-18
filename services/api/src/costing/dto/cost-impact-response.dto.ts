export class CostImpactItemDto {
  menuItemId: string;
  menuItemName: string;
  currentCost: number;
  newCost: number;
  costDifference: number;
  percentChange: number;
}

export class CostImpactResponseDto {
  inventoryItemId: string;
  inventoryItemName: string;
  currentUnitPrice: number;
  newUnitPrice: number;
  affectedMenus: CostImpactItemDto[];
  totalAffectedMenus: number;
}