import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseFloatPipe,
  UseGuards,
} from '@nestjs/common';
import { CostingService } from './costing.service';
import { CreateMenuItemIngredientDto } from './dto/create-menu-item-ingredient.dto';
import { UpdateMenuItemIngredientDto } from './dto/update-menu-item-ingredient.dto';
import { MarkupCalculatorDto } from './dto/markup-calculator.dto';
import { ProfitabilityQueryDto } from './dto/profitability-query.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@Controller('costing')
@UseGuards(JwtAuthGuard)
export class CostingController {
  constructor(private readonly costingService: CostingService) {}

  // ==========================================
  // RECIPE ENDPOINTS
  // ==========================================

  @Post('menu-items/:menuItemId/ingredients')
  async addIngredientToRecipe(
    @Param('menuItemId') menuItemId: string,
    @Body() dto: CreateMenuItemIngredientDto,
  ) {
    return this.costingService.addIngredientToRecipe(menuItemId, dto);
  }

  @Patch('menu-items/:menuItemId/ingredients/:inventoryItemId')
  @Put('menu-items/:menuItemId/ingredients/:inventoryItemId')
  async updateRecipeIngredient(
    @Param('menuItemId') menuItemId: string,
    @Param('inventoryItemId') inventoryItemId: string,
    @Body() dto: UpdateMenuItemIngredientDto,
  ) {
    return this.costingService.updateRecipeIngredient(menuItemId, inventoryItemId, dto);
  }

  @Delete('menu-items/:menuItemId/ingredients/:inventoryItemId')
  async removeIngredientFromRecipe(
    @Param('menuItemId') menuItemId: string,
    @Param('inventoryItemId') inventoryItemId: string,
  ) {
    return this.costingService.removeIngredientFromRecipe(menuItemId, inventoryItemId);
  }

  @Get('menu-items/:menuItemId/recipe')
  async getRecipe(@Param('menuItemId') menuItemId: string) {
    return this.costingService.getRecipe(menuItemId);
  }

  // ==========================================
  // COST CALCULATION ENDPOINTS
  // ==========================================

  @Post('recalculate-all')
  async recalculateAllCosts() {
    return this.costingService.recalculateAllMenuCosts();
  }

  @Post('menu-items/:menuItemId/recalculate')
  async recalculateMenuCost(@Param('menuItemId') menuItemId: string) {
    await this.costingService.recalculateMenuCost(menuItemId);
    return this.costingService.getRecipe(menuItemId);
  }

  // ==========================================
  // MARKUP CALCULATOR
  // ==========================================

  @Post('calculator/markup')
  async calculateMarkup(@Body() dto: MarkupCalculatorDto) {
    return this.costingService.calculateMarkup(dto);
  }

  // ==========================================
  // PROFITABILITY ENDPOINTS
  // ==========================================

  @Get('profitability')
  async getProfitability(@Query() query: ProfitabilityQueryDto) {
    return this.costingService.getProfitability(query);
  }

  @Get('profitability/top')
  async getTopProfitMenus(@Query('limit') limit: string) {
    return this.costingService.getTopProfitMenus(parseInt(limit) || 10);
  }

  @Get('profitability/low-margin')
  async getLowMarginMenus(@Query('threshold') threshold: string) {
    return this.costingService.getLowMarginMenus(parseFloat(threshold) || 30);
  }

  // ==========================================
  // COST IMPACT ANALYSIS
  // ==========================================

  @Get('inventory/:inventoryItemId/impact')
  async getCostImpact(
    @Param('inventoryItemId') inventoryItemId: string,
    @Query('newPrice', ParseFloatPipe) newPrice: number,
  ) {
    return this.costingService.getCostImpact(inventoryItemId, newPrice);
  }

  // ==========================================
  // DASHBOARD
  // ==========================================

  @Get('dashboard')
  async getDashboard() {
    return this.costingService.getCostingDashboard();
  }
}
