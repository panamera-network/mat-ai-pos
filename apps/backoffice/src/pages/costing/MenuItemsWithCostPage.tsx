import { useEffect, useState, useCallback } from 'react';
import { useApi } from '@mat-ai/backoffice';
import { useNavigate } from 'react-router-dom';
import {
  ChefHat, Search, Edit3, ArrowRight, Plus, X,
  AlertTriangle, DollarSign, Tag
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

interface CategoryOption {
  id: string;
  name: string;
}

export const MenuItemsWithCostPage: React.FC = () => {
  const { get, post } = useApi();
  const navigate = useNavigate();
  const [menus, setMenus] = useState<MenuWithCost[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'with-recipe' | 'no-recipe' | 'low-margin'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newMenu, setNewMenu] = useState({
    name: '',
    price: '',
    categoryId: '',
    stock: '0',
    minStock: '0',
  });

  const fetchMenus = useCallback(async () => {
    setLoading(true);
    try {
      const [res, categoriesRes] = await Promise.all([
        get('/menu-items'),
        get('/categories'),
      ]);

      if (categoriesRes.ok) {
        const data = (categoriesRes.data as any[]) || [];
        setCategories(data.map(category => ({
          id: category.id,
          name: category.name,
        })));
      }

      if (res.ok) {
        const data = (res.data as any[]) || [];
        setMenus(data.map(item => {
          let categoryName = 'uncategorized';
          if (item.category) {
            if (typeof item.category === 'string') {
              categoryName = item.category;
            } else if (typeof item.category === 'object' && item.category !== null) {
              categoryName = item.category.name || item.category.id || 'uncategorized';
            }
          }

          return {
            id: item.id,
            name: item.name,
            category: categoryName,
            price: item.price ? Number(item.price) : 0,
            cost: item.cost ? Number(item.cost) : 0,
            profitMargin: item.profitMargin ? Number(item.profitMargin) : 0,
            hasRecipe: (item.menuItemIngredients?.length || item.ingredients?.length || 0) > 0,
          };
        }));
      }
    } catch (err) {
      console.error('Menu fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [get]);

  const handleCreateMenu = async () => {
    const categoryId = newMenu.categoryId || categories[0]?.id;
    if (!newMenu.name.trim() || !categoryId) return;

    setCreating(true);
    try {
      const res = await post('/menu-items', {
        name: newMenu.name.trim(),
        price: parseFloat(newMenu.price) || 0,
        categoryId,
        stock: parseInt(newMenu.stock, 10) || 0,
        minStock: parseInt(newMenu.minStock, 10) || 0,
      });

      setShowCreateModal(false);
      setNewMenu({ name: '', price: '', categoryId: '', stock: '0', minStock: '0' });

      const created = res.data as any;
      if (res.ok && created?.id) {
        navigate(`/costing/recipes/${created.id}`);
      } else {
        fetchMenus();
      }
    } catch (err) {
      console.error('Create menu item error:', err);
    } finally {
      setCreating(false);
    }
  };

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
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Menu Item
        </button>
      </div>

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
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
                      <Tag className="w-3 h-3" />
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
                        Active
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

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Add Menu Item</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  value={newMenu.name}
                  onChange={(e) => setNewMenu({ ...newMenu, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  placeholder="Menu name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input
                    type="number"
                    value={newMenu.price}
                    onChange={(e) => setNewMenu({ ...newMenu, price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newMenu.categoryId || categories[0]?.id || ''}
                    onChange={(e) => setNewMenu({ ...newMenu, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opening Stock</label>
                  <input
                    type="number"
                    value={newMenu.stock}
                    onChange={(e) => setNewMenu({ ...newMenu, stock: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                  <input
                    type="number"
                    value={newMenu.minStock}
                    onChange={(e) => setNewMenu({ ...newMenu, minStock: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMenu}
                disabled={!newMenu.name.trim() || categories.length === 0 || creating}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                {creating ? 'Saving...' : 'Create & Build Recipe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
