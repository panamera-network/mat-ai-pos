import { useEffect, useState, useCallback } from 'react';
import { useApi } from '@mat-ai/backoffice';
import {
  Calculator, TrendingUp, TrendingDown, ChefHat, DollarSign,
  ArrowRight, AlertTriangle, BarChart3, PieChart, Search,
  Filter, RefreshCw, ArrowUpDown, Package, Info
} from 'lucide-react';

interface ProfitabilityItem {
  menuItemId: string;
  menuItemName: string;
  totalCost: number;
  sellingPrice: number;
  profit: number;
  marginPercent: number;
  ingredients: IngredientCost[];
}

interface IngredientCost {
  inventoryItemId: string;
  inventoryItemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalCost: number;
}

interface DashboardData {
  summary: {
    totalMenuItems: number;
    totalInventoryItems: number;
    totalRecipes: number;
    lowStockItems: number;
    averageMargin: number;
  };
  topProfitMenus: ProfitabilityItem[];
  lowMarginMenus: ProfitabilityItem[];
}

type CostingTab = 'dashboard' | 'profitability' | 'calculator' | 'low-margin';

export const CostingPage: React.FC = () => {
  const { get, post } = useApi();
  const [activeTab, setActiveTab] = useState<CostingTab>('dashboard');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [profitability, setProfitability] = useState<ProfitabilityItem[]>([]);
  const [lowMargin, setLowMargin] = useState<ProfitabilityItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculator state
  const [calcCost, setCalcCost] = useState('');
  const [calcMarkup, setCalcMarkup] = useState('30');
  const [calcTargetPrice, setCalcTargetPrice] = useState('');
  const [calcResult, setCalcResult] = useState<any>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'margin' | 'profit' | 'cost' | 'price'>('margin');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get('/costing/dashboard');
      if (res.ok) setDashboard(res.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [get]);

  const fetchProfitability = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('sortBy', sortBy);
      params.append('sortOrder', 'desc');

      const res = await get(`/costing/profitability?${params.toString()}`);
      if (res.ok) setProfitability(res.data || []);
    } catch (err) {
      console.error('Profitability fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [get, categoryFilter, searchQuery, sortBy]);

  const fetchLowMargin = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get('/costing/profitability/low-margin?threshold=30');
      if (res.ok) setLowMargin(res.data || []);
    } catch (err) {
      console.error('Low margin fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
    if (activeTab === 'profitability') fetchProfitability();
    if (activeTab === 'low-margin') fetchLowMargin();
  }, [activeTab, fetchDashboard, fetchProfitability, fetchLowMargin]);

  const handleCalculateMarkup = async () => {
    const payload: any = { cost: parseFloat(calcCost) || 0 };
    if (calcTargetPrice) {
      payload.targetPrice = parseFloat(calcTargetPrice);
    } else {
      payload.markupPercent = parseFloat(calcMarkup) || 30;
    }

    try {
      const res = await post('/costing/calculator/markup', payload);
      if (res.ok) setCalcResult(res.data);
    } catch (err) {
      console.error('Calculator error:', err);
    }
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 60) return 'text-green-600 bg-green-50';
    if (margin >= 40) return 'text-blue-600 bg-blue-50';
    if (margin >= 20) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getMarginBadge = (margin: number) => {
    if (margin >= 60) return 'bg-green-100 text-green-700';
    if (margin >= 40) return 'bg-blue-100 text-blue-700';
    if (margin >= 20) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Costing Engine</h1>
          <p className="text-sm text-gray-500 mt-1">Recipe costing, profitability analysis & pricing tools</p>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'dashboard') fetchDashboard();
            if (activeTab === 'profitability') fetchProfitability();
            if (activeTab === 'low-margin') fetchLowMargin();
          }}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white border rounded-lg p-1">
        {[
          { key: 'dashboard' as CostingTab, label: '📊 Dashboard', icon: BarChart3 },
          { key: 'profitability' as CostingTab, label: '💰 Profitability', icon: TrendingUp },
          { key: 'calculator' as CostingTab, label: '🧮 Calculator', icon: Calculator },
          { key: 'low-margin' as CostingTab, label: '⚠️ Low Margin', icon: AlertTriangle },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ==========================================
          DASHBOARD TAB
      ========================================== */}
      {activeTab === 'dashboard' && dashboard && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Menu Items</p>
                <ChefHat className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{dashboard.summary.totalMenuItems}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Ingredients</p>
                <Package className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{dashboard.summary.totalInventoryItems}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Recipes</p>
                <PieChart className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{dashboard.summary.totalRecipes}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Low Stock</p>
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-2xl font-bold text-orange-600">{dashboard.summary.lowStockItems}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-500">Avg Margin</p>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-600">{dashboard.summary.averageMargin.toFixed(1)}%</p>
            </div>
          </div>

          {/* Top Profit Menus */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Top Profit Menus (by Margin)
              </h3>
              <button
                onClick={() => setActiveTab('profitability')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View All →
              </button>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Menu</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Cost</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Price</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Profit</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dashboard.topProfitMenus?.map((item) => (
                  <tr key={item.menuItemId} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{item.menuItemName}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 text-right">RM {item.totalCost.toFixed(2)}</td>
                    <td className="px-6 py-3 text-sm text-gray-900 text-right font-medium">RM {item.sellingPrice.toFixed(2)}</td>
                    <td className="px-6 py-3 text-sm text-green-600 text-right font-medium">+RM {item.profit.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${getMarginBadge(item.marginPercent)}`}>
                        {item.marginPercent.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Low Margin Alerts */}
          {dashboard.lowMarginMenus?.length > 0 && (
            <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-red-100 flex items-center justify-between">
                <h3 className="font-semibold text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Low Margin Alerts (Below 30%)
                </h3>
                <button
                  onClick={() => setActiveTab('low-margin')}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  View All →
                </button>
              </div>
              <table className="w-full">
                <thead className="bg-red-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-red-600 uppercase">Menu</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-red-600 uppercase">Cost</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-red-600 uppercase">Price</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-red-600 uppercase">Margin</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-red-600 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-50">
                  {dashboard.lowMarginMenus?.slice(0, 5).map((item) => (
                    <tr key={item.menuItemId} className="hover:bg-red-50/50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{item.menuItemName}</td>
                      <td className="px-6 py-3 text-sm text-gray-600 text-right">RM {item.totalCost.toFixed(2)}</td>
                      <td className="px-6 py-3 text-sm text-gray-900 text-right">RM {item.sellingPrice.toFixed(2)}</td>
                      <td className="px-6 py-3 text-right">
                        <span className="inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700">
                          {item.marginPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-xs text-red-600">Consider price increase</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          PROFITABILITY TAB
      ========================================== */}
      {activeTab === 'profitability' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search menus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-white border rounded-lg text-sm"
            >
              <option value="all">All Categories</option>
              <option value="pizza">🍕 Pizza</option>
              <option value="pasta">🍝 Pasta</option>
              <option value="sides">🍟 Sides</option>
              <option value="drink">🥤 Drink</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-white border rounded-lg text-sm"
            >
              <option value="margin">Sort by Margin</option>
              <option value="profit">Sort by Profit</option>
              <option value="cost">Sort by Cost</option>
              <option value="price">Sort by Price</option>
            </select>
          </div>

          {/* Profitability Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Menu</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Cost/Porsi</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Harga Jual</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Untung</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Margin %</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Ingredients</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {profitability.map((item) => (
                  <tr key={item.menuItemId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{item.menuItemName}</p>
                      <p className="text-xs text-gray-500">{item.ingredients.length} ingredients</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right">RM {item.totalCost.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">RM {item.sellingPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <span className={`font-medium ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.profit >= 0 ? '+' : ''}RM {item.profit.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${getMarginBadge(item.marginPercent)}`}>
                        {item.marginPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {item.ingredients.slice(0, 3).map((ing) => (
                          <span key={ing.inventoryItemId} className="inline-flex px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                            {ing.inventoryItemName} ({ing.quantity}{ing.unit})
                          </span>
                        ))}
                        {item.ingredients.length > 3 && (
                          <span className="inline-flex px-2 py-1 rounded text-xs bg-gray-100 text-gray-500">
                            +{item.ingredients.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {profitability.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                      <p>No menu items found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          CALCULATOR TAB
      ========================================== */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Markup Calculator */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-500" />
              Markup & Harga Jual Calculator
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kos Bahan (RM)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    value={calcCost}
                    onChange={(e) => setCalcCost(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Markup %</label>
                  <input
                    type="number"
                    value={calcMarkup}
                    onChange={(e) => setCalcMarkup(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="30"
                  />
                </div>
                <span className="text-gray-400 mt-6">or</span>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Price (RM)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={calcTargetPrice}
                    onChange={(e) => setCalcTargetPrice(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <button
                onClick={handleCalculateMarkup}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <Calculator className="w-4 h-4" />
                Kira Harga Jual
              </button>
            </div>

            {calcResult && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Kos:</span>
                  <span className="text-sm font-medium">RM {calcResult.cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Markup:</span>
                  <span className="text-sm font-medium">{calcResult.markupPercent}%</span>
                </div>
                <div className="border-t border-blue-200 pt-2 flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-700">Harga Jual Cadangan:</span>
                  <span className="text-xl font-bold text-blue-700">RM {calcResult.suggestedPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Untung:</span>
                  <span className="text-sm font-medium text-green-600">+RM {calcResult.profit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Margin:</span>
                  <span className={`text-sm font-medium ${calcResult.marginPercent >= 30 ? 'text-green-600' : 'text-orange-600'}`}>
                    {calcResult.marginPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Reference */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-purple-500" />
              Quick Reference Guide
            </h3>
            <div className="space-y-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-700">Margin ≥ 60% — Excellent</p>
                <p className="text-xs text-green-600">High profitability. Good pricing strategy.</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-700">Margin 40-60% — Good</p>
                <p className="text-xs text-blue-600">Healthy profit. Monitor ingredient costs.</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium text-yellow-700">Margin 20-40% — Fair</p>
                <p className="text-xs text-yellow-600">Acceptable but watch costs closely.</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm font-medium text-red-700">Margin &lt; 20% — Warning</p>
                <p className="text-xs text-red-600">Low profit. Consider price increase or cost reduction.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Formula</p>
                <p className="text-xs text-gray-600 mt-1">
                  <strong>Markup:</strong> Harga = Kos ÷ (1 - Markup%)<br/>
                  <strong>Margin:</strong> (Harga - Kos) ÷ Harga × 100%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          LOW MARGIN TAB
      ========================================== */}
      {activeTab === 'low-margin' && (
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800">
                {lowMargin.length} menu items have margin below 30%
              </p>
              <p className="text-xs text-red-600">
                Consider increasing prices or reducing ingredient costs for these items.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-red-50 border-b border-red-100">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-red-600 uppercase">Menu</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-red-600 uppercase">Cost</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-red-600 uppercase">Price</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-red-600 uppercase">Profit</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-red-600 uppercase">Margin</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-red-600 uppercase">Suggestion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lowMargin.map((item) => {
                  const suggestedPrice = item.totalCost / (1 - 0.30); // 30% margin target
                  return (
                    <tr key={item.menuItemId} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{item.menuItemName}</p>
                        <p className="text-xs text-gray-500">{item.ingredients.length} ingredients</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-right">RM {item.totalCost.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">RM {item.sellingPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-right">
                        <span className="text-red-600 font-medium">RM {item.profit.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700">
                          {item.marginPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-600">
                          Suggested price for 30% margin: <strong className="text-green-600">RM {suggestedPrice.toFixed(2)}</strong>
                        </p>
                      </td>
                    </tr>
                  );
                })}
                {lowMargin.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-400" />
                      <p>All menu items have healthy margins! 🎉</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};