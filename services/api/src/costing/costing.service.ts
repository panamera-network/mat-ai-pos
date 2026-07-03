import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMenuItemIngredientDto } from './dto/create-menu-item-ingredient.dto';
import { UpdateMenuItemIngredientDto } from './dto/update-menu-item-ingredient.dto';
import { MarkupCalculatorDto, MarkupCalculatorResponseDto, PricingMethod } from './dto/markup-calculator.dto';
import { RecipeCostResponseDto, IngredientCostDto } from './dto/recipe-cost-response.dto';
import { ProfitabilityQueryDto, ProfitabilitySortBy, ProfitabilitySortOrder } from './dto/profitability-query.dto';
import { CostImpactResponseDto, CostImpactItemDto } from './dto/cost-impact-response.dto';

@Injectable()
export class CostingService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // RECIPE MANAGEMENT
  // ==========================================

  async addIngredientToRecipe(menuItemId: string, dto: CreateMenuItemIngredientDto) {
    // Verify menu item exists
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });
    if (!menuItem) {
      throw new NotFoundException(`Menu item with ID ${menuItemId} not found`);
    }

    // Verify inventory item exists
    const inventoryItem = await this.prisma.inventoryItem.findUnique({
      where: { id: dto.inventoryItemId },
    });
    if (!inventoryItem) {
      throw new NotFoundException(`Inventory item with ID ${dto.inventoryItemId} not found`);
    }

    // Create or update the recipe ingredient
    const recipeIngredient = await this.prisma.menuItemIngredient.upsert({
      where: {
        menuItemId_inventoryItemId: {
          menuItemId,
          inventoryItemId: dto.inventoryItemId,
        },
      },
      update: {
        quantityUsed: dto.quantity,
      },
      create: {
        menuItemId,
        inventoryItemId: dto.inventoryItemId,
        quantityUsed: dto.quantity,
      },
      include: {
        inventoryItem: true,
      },
    });

    // Recalculate menu item cost
    await this.recalculateMenuCost(menuItemId);

    return recipeIngredient;
  }

  async updateRecipeIngredient(
    menuItemId: string,
    inventoryItemId: string,
    dto: UpdateMenuItemIngredientDto,
  ) {
    const updated = await this.prisma.menuItemIngredient.update({
      where: {
        menuItemId_inventoryItemId: {
          menuItemId,
          inventoryItemId,
        },
      },
      data: {
        quantityUsed: dto.quantity,
      },
      include: {
        inventoryItem: true,
      },
    });

    await this.recalculateMenuCost(menuItemId);
    return updated;
  }

  async removeIngredientFromRecipe(menuItemId: string, inventoryItemId: string) {
    await this.prisma.menuItemIngredient.delete({
      where: {
        menuItemId_inventoryItemId: {
          menuItemId,
          inventoryItemId,
        },
      },
    });

    await this.recalculateMenuCost(menuItemId);
    return { message: 'Ingredient removed from recipe' };
  }

  async getRecipe(menuItemId: string): Promise<RecipeCostResponseDto> {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: {
        ingredients: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    if (!menuItem) {
      throw new NotFoundException(`Menu item with ID ${menuItemId} not found`);
    }

    const ingredients: IngredientCostDto[] = menuItem.ingredients.map((mi) => {
      const unitPrice = mi.inventoryItem?.unitPrice || 0;  // ← null check
      const totalCost = unitPrice * mi.quantityUsed;
      return {
        inventoryItemId: mi.inventoryItemId || '',
        inventoryItemName: mi.inventoryItem?.name || 'Unknown',  // ← null check
        quantity: mi.quantityUsed,
        unit: mi.inventoryItem?.unitOfMeasure || 'g',  // ← null check
        unitPrice,
        totalCost: Math.round(totalCost * 100) / 100,
      };
    });

    const totalCost = ingredients.reduce((sum, ing) => sum + ing.totalCost, 0);
    const price = Number(menuItem.price);
    const profit = price - totalCost;
    const marginPercent = price > 0 ? (profit / price) * 100 : 0;

    return {
      menuItemId: menuItem.id,
      menuItemName: menuItem.name,
      totalCost: Math.round(totalCost * 100) / 100,
      sellingPrice: price,
      profit: Math.round(profit * 100) / 100,
      marginPercent: Math.round(marginPercent * 100) / 100,
      ingredients,
    };
  }

  // ==========================================
  // COST CALCULATION
  // ==========================================

  async recalculateMenuCost(menuItemId: string): Promise<void> {
    const recipe = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: {
        ingredients: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    if (!recipe) return;

    const totalCost = recipe.ingredients.reduce((sum, mi) => {
      const unitPrice = mi.inventoryItem.unitPrice || 0;
      return sum + (unitPrice * mi.quantityUsed);
    }, 0);

    const price = Number(recipe.price);
    const profit = price - totalCost;
    const marginPercent = price > 0 ? (profit / price) * 100 : 0;

    await this.prisma.menuItem.update({
      where: { id: menuItemId },
      data: {
        cost: Math.round(totalCost * 100) / 100,
        profitMargin: Math.round(marginPercent * 100) / 100,
      },
    });
  }

  async recalculateAllMenuCosts(): Promise<{ updated: number }> {
    const menuItems = await this.prisma.menuItem.findMany({
      select: { id: true },
    });

    for (const menuItem of menuItems) {
      await this.recalculateMenuCost(menuItem.id);
    }

    return { updated: menuItems.length };
  }

  // ==========================================
  // MARKUP CALCULATOR (Updated with Food Cost %)
  // ==========================================

  calculateMarkup(dto: MarkupCalculatorDto): MarkupCalculatorResponseDto {
    const cost = dto.cost;

    if (dto.targetPrice) {
      // Analyze a target price
      const profit = dto.targetPrice - cost;
      const marginPercent = dto.targetPrice > 0 ? (profit / dto.targetPrice) * 100 : 0;
      const markupPercentActual = cost > 0 ? (profit / cost) * 100 : 0;
      const foodCostPercent = dto.targetPrice > 0 ? (cost / dto.targetPrice) * 100 : 0;

      return {
        cost,
        method: PricingMethod.MARGIN,
        markupPercent: 0,
        targetMargin: Math.round(marginPercent * 100) / 100,
        targetFoodCostPercent: Math.round(foodCostPercent * 100) / 100,
        suggestedPrice: dto.targetPrice,
        profit: Math.round(profit * 100) / 100,
        marginPercent: Math.round(marginPercent * 100) / 100,
        markupPercentActual: Math.round(markupPercentActual * 100) / 100,
        foodCostPercent: Math.round(foodCostPercent * 100) / 100,
        targetPrice: dto.targetPrice,
        targetPriceAnalysis: {
          marginPercent: Math.round(marginPercent * 100) / 100,
          markupPercent: Math.round(markupPercentActual * 100) / 100,
          foodCostPercent: Math.round(foodCostPercent * 100) / 100,
          profit: Math.round(profit * 100) / 100,
        },
      };
    }

    const method = dto.method || PricingMethod.FOOD_COST;
    let suggestedPrice: number;
    let markupPercent = 0;
    let targetMargin = 0;
    let targetFoodCostPercent = 0;

    switch (method) {
      case PricingMethod.MARKUP:
        // Price = Cost × (1 + markup%)
        markupPercent = dto.markupPercent || 30;
        suggestedPrice = cost * (1 + markupPercent / 100);
        break;

      case PricingMethod.MARGIN:
        // Price = Cost / (1 - margin%)
        targetMargin = dto.targetMargin || 30;
        if (targetMargin >= 100) {
          suggestedPrice = 0; // invalid
        } else {
          suggestedPrice = cost / (1 - targetMargin / 100);
        }
        break;

      case PricingMethod.FOOD_COST:
      default:
        // Price = Cost / (food_cost% / 100)
        // Industry standard!
        targetFoodCostPercent = dto.targetFoodCostPercent || 35;
        if (targetFoodCostPercent <= 0) {
          suggestedPrice = 0;
        } else {
          suggestedPrice = cost / (targetFoodCostPercent / 100);
        }
        break;
    }

    const profit = suggestedPrice - cost;
    const marginPercent = suggestedPrice > 0 ? (profit / suggestedPrice) * 100 : 0;
    const markupPercentActual = cost > 0 ? (profit / cost) * 100 : 0;
    const foodCostPercent = suggestedPrice > 0 ? (cost / suggestedPrice) * 100 : 0;

    return {
      cost,
      method,
      markupPercent: Math.round(markupPercent * 100) / 100,
      targetMargin: Math.round(targetMargin * 100) / 100,
      targetFoodCostPercent: Math.round(targetFoodCostPercent * 100) / 100,
      suggestedPrice: Math.round(suggestedPrice * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      marginPercent: Math.round(marginPercent * 100) / 100,
      markupPercentActual: Math.round(markupPercentActual * 100) / 100,
      foodCostPercent: Math.round(foodCostPercent * 100) / 100,
    };
  }

  // ==========================================
  // PROFITABILITY ANALYSIS
  // ==========================================

  async getProfitability(query: ProfitabilityQueryDto = {}): Promise<RecipeCostResponseDto[]> {
  const where: any = {};

  if (query.category) {
    where.categoryId = query.category;  // ← FIX
  }

  if (query.search) {
    where.name = { contains: query.search, mode: 'insensitive' };
  }

  const menuItems = await this.prisma.menuItem.findMany({
    where,
    include: {
      ingredients: {
        include: {
          inventoryItem: true,
        },
      },
    },
  });

  const results: RecipeCostResponseDto[] = menuItems.map((menuItem) => {
    const ingredients: IngredientCostDto[] = menuItem.ingredients.map((mi) => {
      const unitPrice = mi.inventoryItem?.unitPrice || 0;
      return {
        inventoryItemId: mi.inventoryItemId,
        inventoryItemName: mi.inventoryItem?.name || 'Unknown',
        quantity: mi.quantityUsed,
        unit: mi.inventoryItem?.unitOfMeasure || 'g',
        unitPrice,
        totalCost: Math.round(unitPrice * mi.quantityUsed * 100) / 100,
      };
    });

    const totalCost = ingredients.reduce((sum, ing) => sum + ing.totalCost, 0);
    const price = Number(menuItem.price);
    const profit = price - totalCost;
    const marginPercent = price > 0 ? (profit / price) * 100 : 0;

    return {
      menuItemId: menuItem.id,
      menuItemName: menuItem.name,
      totalCost: Math.round(totalCost * 100) / 100,
      sellingPrice: price,
      profit: Math.round(profit * 100) / 100,
      marginPercent: Math.round(marginPercent * 100) / 100,
      ingredients,
    };
  });

  // Sort results
  const sortBy = query.sortBy || ProfitabilitySortBy.MARGIN;
  const sortOrder = query.sortOrder || ProfitabilitySortOrder.DESC;

  results.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case ProfitabilitySortBy.PROFIT:
        comparison = a.profit - b.profit;
        break;
      case ProfitabilitySortBy.MARGIN:
        comparison = a.marginPercent - b.marginPercent;
        break;
      case ProfitabilitySortBy.COST:
        comparison = a.totalCost - b.totalCost;
        break;
      case ProfitabilitySortBy.PRICE:
        comparison = a.sellingPrice - b.sellingPrice;
        break;
    }
    return sortOrder === ProfitabilitySortOrder.ASC ? comparison : -comparison;
  });

  return results;
}

  async getTopProfitMenus(limit: number = 10): Promise<RecipeCostResponseDto[]> {
    const results = await this.getProfitability({
      sortBy: ProfitabilitySortBy.MARGIN,
      sortOrder: ProfitabilitySortOrder.DESC,
    });
    return results.slice(0, limit);
  }

  async getLowMarginMenus(threshold: number = 30): Promise<RecipeCostResponseDto[]> {
  const allMenus = await this.getProfitability({
    sortBy: ProfitabilitySortBy.MARGIN,
    sortOrder: ProfitabilitySortOrder.ASC,
  });
  return allMenus.filter((menu) => menu.marginPercent < threshold);
}

  // ==========================================
  // COST IMPACT ANALYSIS
  // ==========================================

  async getCostImpact(
    inventoryItemId: string,
    newUnitPrice: number,
  ): Promise<CostImpactResponseDto> {
    const inventoryItem = await this.prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId },
      include: {
        ingredients: {
          include: {
            menuItem: {
              include: {
                ingredients: {
                  include: {
                    inventoryItem: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!inventoryItem) {
      throw new NotFoundException(`Inventory item with ID ${inventoryItemId} not found`);
    }

    const currentUnitPrice = inventoryItem.unitPrice || 0;

    const affectedMenus: CostImpactItemDto[] = inventoryItem.ingredients.map((mi) => {
      const menuItem = mi.menuItem;

      // Calculate current cost
      const currentCost = menuItem.ingredients.reduce((sum, ingredient) => {
        const price = ingredient.inventoryItemId === inventoryItemId
          ? currentUnitPrice
          : (ingredient.inventoryItem.unitPrice || 0);
        return sum + (price * ingredient.quantityUsed);
      }, 0);

      // Calculate new cost with updated price
      const newCost = menuItem.ingredients.reduce((sum, ingredient) => {
        const price = ingredient.inventoryItemId === inventoryItemId
          ? newUnitPrice
          : (ingredient.inventoryItem.unitPrice || 0);
        return sum + (price * ingredient.quantityUsed);
      }, 0);

      const costDifference = newCost - currentCost;
      const percentChange = currentCost > 0 ? (costDifference / currentCost) * 100 : 0;

      return {
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        currentCost: Math.round(currentCost * 100) / 100,
        newCost: Math.round(newCost * 100) / 100,
        costDifference: Math.round(costDifference * 100) / 100,
        percentChange: Math.round(percentChange * 100) / 100,
      };
    });

    return {
      inventoryItemId,
      inventoryItemName: inventoryItem.name,
      currentUnitPrice: Math.round(currentUnitPrice * 100) / 100,
      newUnitPrice: Math.round(newUnitPrice * 100) / 100,
      affectedMenus,
      totalAffectedMenus: affectedMenus.length,
    };
  }

  // ==========================================
  // DASHBOARD STATS
  // ==========================================

  async getCostingDashboard() {
  const [
    totalMenuItems,
    totalInventoryItems,
    totalRecipes,
    avgMargin,
  ] = await Promise.all([
    this.prisma.menuItem.count(),
    this.prisma.inventoryItem.count(),
    this.prisma.menuItemIngredient.count(),
    this.prisma.menuItem.aggregate({
      _avg: { profitMargin: true },
    }),
  ]);

  // Manual query for low stock (compare currentStock <= minStock)
  const inventoryItems = await this.prisma.inventoryItem.findMany({
    select: { currentStock: true, minStock: true },
  });
  const lowStockItems = inventoryItems.filter(
    item => item.currentStock <= item.minStock
  ).length;

  const [topProfitMenus, lowMarginMenus] = await Promise.all([
    this.getTopProfitMenus(5).catch(() => []),
    this.getLowMarginMenus(30).catch(() => []),
  ]);

  return {
    summary: {
      totalMenuItems,
      totalInventoryItems,
      totalRecipes,
      lowStockItems,
      averageMargin: Math.round((avgMargin._avg.profitMargin || 0) * 100) / 100,
    },
    topProfitMenus,
    lowMarginMenus,
  };
}
}
