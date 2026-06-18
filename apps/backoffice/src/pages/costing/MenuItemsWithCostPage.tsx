import { useEffect, useState, useCallback } from 'react';
import { useApi } from '@mat-ai/backoffice';
import { useNavigate } from 'react-router-dom';
import {
  ChefHat, Search, Plus, Edit3, ArrowRight, TrendingUp,
  TrendingDown, AlertTriangle, DollarSign
} from 'lucide-react';

interface MenuWithCost {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  profitMargin: number;
  hasRecipe: boolean;
}

export const MenuItemsWithCostPage: React.FC = () => {
  const { get } = useApi();
  const navigate = useNavigate();
  const [menus, setMenus] = useState<MenuWithCost[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'with-recipe' | 'no-recipe' | 'low-margin'>('all');

  const fetchMenus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get('/menu-items');
      if (res.ok) {
        const data = (res.data as any[]) || [];
        setMenus(data.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category || 'uncategorized',
          price: item.price || 0,
          cost: item.cost || 0,
          profitMargin: item.profitMargin || 0,
          hasRecipe: (item.menuItemIngredients?.length || 0) > 0,
        })));
      }
    } catch (err) {
      console.error('Menu fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const filteredMenus = menus
    .filter(menu => {
      if (filter === 'with-recipe') return menu.hasRecipe;
      if (filter === 'no-recipe') return !menu.hasRecipe;
      if (filter === 'low-margin') return menu.profitMargin < 30;
      return true;
    })
    .filter(menu =>
      menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      menu.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getMarginColor = (margin: number) => {
    if (margin >= 60) return 'text-green-600';
    if (margin >= 40) return 'text-blue-600';
    if (margin >= 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMarginBadge = (margin: number) => {
    if (margin >= 60) return 'bg-green-100 text-green-700';
    if (margin >= 40) return 'bg-blue-100 text-blue-700';
    if (margin >= 20) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-blue-500" />
            Menu Items & Recipes
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage menu recipes and view costing</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg text-sm"
          />
        </div>
        <div className="flex bg-white border rounded-lg p-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'with-recipe', label: 'With Recipe' },
            { key: 'no-recipe', label: 'No Recipe' },
            { key: 'low-margin', label: 'Low Margin' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Menu</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Category</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Price</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Cost</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Profit</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Margin</th>
              <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Recipe</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredMenus.map((menu) => {
              const profit = menu.price - menu.cost;
              return (
                <tr key={menu.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{menu.name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
                      {menu.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                    RM {menu.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-right">
                    {menu.cost > 0 ? `RM ${menu.cost.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    {menu.cost > 0 ? (
                      <span className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profit >= 0 ? '+' : ''}RM {profit.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {menu.cost > 0 ? (
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${getMarginBadge(menu.profitMargin)}`}>
                        {menu.profitMargin.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">No recipe</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {menu.hasRecipe ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700">
                        <DollarSign className="w-3 h-3" />
                        {menu.cost > 0 ? 'Active' : 'Pending'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500">
                        <AlertTriangle className="w-3 h-3" />
                        Missing
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/costing/recipes/${menu.id}`)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 ml-auto"
                    >
                      <Edit3 className="w-4 h-4" />
                      {menu.hasRecipe ? 'Edit Recipe' : 'Build Recipe'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredMenus.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                  <ChefHat className="w-8 h-8 mx-auto mb-2" />
                  <p>No menu items found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};