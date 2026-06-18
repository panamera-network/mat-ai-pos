import { useEffect, useState, useCallback } from 'react';
import { useApi } from '@mat-ai/backoffice';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChefHat, Plus, X, Save, ArrowLeft, Calculator,
  DollarSign, Package, AlertCircle, Trash2
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  profitMargin: number;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  unitOfMeasure: string;
}

interface RecipeIngredient {
  inventoryItemId: string;
  inventoryItemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalCost: number;
}

export const RecipeBuilderPage: React.FC = () => {
  const { menuItemId } = useParams<{ menuItemId: string }>();
  const navigate = useNavigate();
  const { get, post, put, del } = useApi();

  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recipe, setRecipe] = useState<RecipeIngredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // New ingredient form
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('g');

  const fetchData = useCallback(async () => {
    if (!menuItemId) return;
    setLoading(true);
    try {
      const [menuRes, invRes, recipeRes] = await Promise.all([
        get(`/menu-items/${menuItemId}`),
        get('/inventory'),
        get(`/costing/menu-items/${menuItemId}/recipe`),
      ]);

      if (menuRes.ok) setMenuItem(menuRes.data);
      if (invRes.ok) setInventory(invRes.data || []);
      if (recipeRes.ok) {
        setRecipe(recipeRes.data?.ingredients || []);
      }
    } catch (err) {
      console.error('Recipe fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [get, menuItemId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalCost = recipe.reduce((sum, ing) => sum + ing.totalCost, 0);
  const profit = (menuItem?.price || 0) - totalCost;
  const margin = menuItem?.price ? (profit / menuItem.price) * 100 : 0;

  const handleAddIngredient = async () => {
    if (!menuItemId || !selectedIngredient || !quantity) return;

    setSaving(true);
    try {
      await post(`/costing/menu-items/${menuItemId}/ingredients`, {
        inventoryItemId: selectedIngredient,
        quantity: parseFloat(quantity) || 0,
        unit,
      });
      setSelectedIngredient('');
      setQuantity('');
      fetchData();
    } catch (err) {
      console.error('Add ingredient error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateIngredient = async (inventoryItemId: string, newQuantity: number) => {
    if (!menuItemId) return;
    try {
      await put(`/costing/menu-items/${menuItemId}/ingredients/${inventoryItemId}`, {
        quantity: newQuantity,
        unit,
      });
      fetchData();
    } catch (err) {
      console.error('Update ingredient error:', err);
    }
  };

  const handleRemoveIngredient = async (inventoryItemId: string) => {
    if (!menuItemId) return;
    if (!confirm('Remove this ingredient from recipe?')) return;
    try {
      await del(`/costing/menu-items/${menuItemId}/ingredients/${inventoryItemId}`);
      fetchData();
    } catch (err) {
      console.error('Remove ingredient error:', err);
    }
  };

  const handleRecalculate = async () => {
    if (!menuItemId) return;
    try {
      await post(`/costing/menu-items/${menuItemId}/recalculate`);
      fetchData();
    } catch (err) {
      console.error('Recalculate error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/costing')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-blue-500" />
            Recipe Builder
          </h1>
          <p className="text-sm text-gray-500">
            {menuItem?.name || 'Loading...'} — {menuItem?.category}
          </p>
        </div>
      </div>

      {/* Cost Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Selling Price</p>
          <p className="text-2xl font-bold text-gray-900">RM {menuItem?.price.toFixed(2) || '0.00'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Total Cost</p>
          <p className="text-2xl font-bold text-orange-600">RM {totalCost.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Profit</p>
          <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {profit >= 0 ? '+' : ''}RM {profit.toFixed(2)}
          </p>
        </div>
        <div className={`rounded-xl border p-5 ${
          margin >= 30 ? 'bg-green-50 border-green-200' : 
          margin >= 20 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-sm ${margin >= 30 ? 'text-green-600' : margin >= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
            Margin
          </p>
          <p className={`text-2xl font-bold ${
            margin >= 30 ? 'text-green-700' : margin >= 20 ? 'text-yellow-700' : 'text-red-700'
          }`}>
            {margin.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Margin Alert */}
      {margin < 20 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-800">Low margin warning!</p>
            <p className="text-xs text-red-600">
              This menu has a margin of {margin.toFixed(1)}%. Consider increasing the price or reducing ingredient costs.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ingredient List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Recipe Ingredients</h3>
              <button
                onClick={handleRecalculate}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100"
              >
                <Calculator className="w-4 h-4" />
                Recalculate
              </button>
            </div>

            {recipe.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Package className="w-8 h-8 mx-auto mb-2" />
                <p>No ingredients added yet</p>
                <p className="text-xs mt-1">Add ingredients to build the recipe</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ingredient</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recipe.map((ing) => (
                    <tr key={ing.inventoryItemId} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{ing.inventoryItemName}</td>
                      <td className="px-6 py-3 text-sm text-gray-600 text-right">
                        <input
                          type="number"
                          value={ing.quantity}
                          onChange={(e) => handleUpdateIngredient(ing.inventoryItemId, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border rounded text-right text-sm"
                        />
                        <span className="text-xs text-gray-500 ml-1">{ing.unit}</span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600 text-right">
                        RM {ing.unitPrice.toFixed(4)}/{ing.unit}
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900 text-right">
                        RM {ing.totalCost.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => handleRemoveIngredient(ing.inventoryItemId)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-6 py-3 text-sm font-medium text-gray-700 text-right">Total Cost:</td>
                    <td className="px-6 py-3 text-sm font-bold text-gray-900 text-right">RM {totalCost.toFixed(2)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>

        {/* Add Ingredient Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 h-fit">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-500" />
            Add Ingredient
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Ingredient</label>
              <select
                value={selectedIngredient}
                onChange={(e) => setSelectedIngredient(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Choose ingredient...</option>
                {inventory.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} — RM {item.unitPrice.toFixed(4)}/{item.unitOfMeasure}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  placeholder="Amount..."
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="ml">ml</option>
                  <option value="l">l</option>
                  <option value="pcs">pcs</option>
                </select>
              </div>
            </div>
            {selectedIngredient && quantity && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  Estimated cost: <strong>RM {(
                    (inventory.find(i => i.id === selectedIngredient)?.unitPrice || 0) * 
                    (parseFloat(quantity) || 0)
                  ).toFixed(2)}</strong>
                </p>
              </div>
            )}
            <button
              onClick={handleAddIngredient}
              disabled={!selectedIngredient || !quantity || saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              {saving ? 'Adding...' : 'Add to Recipe'}
            </button>
          </div>

          {/* Ingredient Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">
              <DollarSign className="w-3 h-3 inline mr-1" />
              Available ingredients: {inventory.length}
            </p>
            <p className="text-xs text-gray-500">
              <Package className="w-3 h-3 inline mr-1" />
              Recipe ingredients: {recipe.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};