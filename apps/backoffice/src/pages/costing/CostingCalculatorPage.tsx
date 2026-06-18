import { useState } from 'react';
import { useApi } from '@mat-ai/backoffice';
import {
  Calculator, DollarSign, TrendingUp, Percent, ChefHat,
  ArrowRight, Info, CheckCircle2
} from 'lucide-react';

type PricingMethod = 'food_cost' | 'markup' | 'margin' | 'target_price';

interface CalcResult {
  cost: number;
  method: PricingMethod;
  suggestedPrice: number;
  profit: number;
  marginPercent: number;
  markupPercentActual: number;
  foodCostPercent: number;
  targetPriceAnalysis?: {
    marginPercent: number;
    markupPercent: number;
    foodCostPercent: number;
    profit: number;
  };
}

const METHOD_INFO: Record<PricingMethod, { label: string; desc: string; icon: any; color: string }> = {
  food_cost: {
    label: 'Food Cost %',
    desc: 'Industry standard. Set what % of selling price should be food cost.',
    icon: ChefHat,
    color: 'bg-green-600',
  },
  markup: {
    label: 'Markup on Cost',
    desc: 'Add X% on top of your cost.',
    icon: Percent,
    color: 'bg-blue-600',
  },
  margin: {
    label: 'Profit Margin',
    desc: 'Target X% of selling price as profit.',
    icon: TrendingUp,
    color: 'bg-purple-600',
  },
  target_price: {
    label: 'Analyze Price',
    desc: 'Input a price and see all metrics.',
    icon: DollarSign,
    color: 'bg-orange-600',
  },
};

const FOOD_COST_GUIDE = [
  { range: '20-25%', type: 'Fine Dining', color: 'text-emerald-600' },
  { range: '25-30%', type: 'Casual Dining', color: 'text-green-600' },
  { range: '30-35%', type: 'Fast Food / QSR', color: 'text-blue-600' },
  { range: '35-40%', type: 'Pizza / Pasta', color: 'text-yellow-600' },
  { range: '40-50%', type: 'High Cost Items', color: 'text-orange-600' },
  { range: '>50%', type: 'Warning! Too high', color: 'text-red-600' },
];

export const CostingCalculatorPage: React.FC = () => {
  const { post } = useApi();

  const [method, setMethod] = useState<PricingMethod>('food_cost');
  const [cost, setCost] = useState('');
  const [markupPercent, setMarkupPercent] = useState('30');
  const [targetMargin, setTargetMargin] = useState('30');
  const [targetFoodCost, setTargetFoodCost] = useState('35');
  const [targetPrice, setTargetPrice] = useState('');
  const [result, setResult] = useState<CalcResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    const costNum = parseFloat(cost) || 0;
    if (costNum <= 0) return;

    setLoading(true);

    const payload: any = { cost: costNum, method };

    if (method === 'markup') {
      payload.markupPercent = parseFloat(markupPercent) || 30;
    } else if (method === 'margin') {
      payload.targetMargin = parseFloat(targetMargin) || 30;
    } else if (method === 'food_cost') {
      payload.targetFoodCostPercent = parseFloat(targetFoodCost) || 35;
    } else if (method === 'target_price') {
      payload.targetPrice = parseFloat(targetPrice) || 0;
    }

    try {
      const res = await post('/costing/calculator/markup', payload);
      if (res.ok) setResult(res.data);
    } catch (err) {
      console.error('Calculator error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMetricColor = (value: number, type: 'margin' | 'foodcost') => {
    if (type === 'margin') {
      if (value >= 60) return 'text-green-600';
      if (value >= 40) return 'text-blue-600';
      if (value >= 20) return 'text-yellow-600';
      return 'text-red-600';
    }
    // food cost
    if (value <= 30) return 'text-green-600';
    if (value <= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMetricBg = (value: number, type: 'margin' | 'foodcost') => {
    if (type === 'margin') {
      if (value >= 60) return 'bg-green-50 border-green-200';
      if (value >= 40) return 'bg-blue-50 border-blue-200';
      if (value >= 20) return 'bg-yellow-50 border-yellow-200';
      return 'bg-red-50 border-red-200';
    }
    // food cost
    if (value <= 30) return 'bg-green-50 border-green-200';
    if (value <= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-blue-500" />
          Pricing Calculator
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Calculate selling price using industry-standard methods
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculator Form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Method Selector */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Select Pricing Method</p>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(METHOD_INFO) as PricingMethod[]).map((m) => {
                const info = METHOD_INFO[m];
                const Icon = info.icon;
                return (
                  <button
                    key={m}
                    onClick={() => { setMethod(m); setResult(null); }}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all ${
                      method === m 
                        ? `border-blue-500 bg-blue-50` 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${info.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${method === m ? 'text-blue-700' : 'text-gray-900'}`}>
                        {info.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{info.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="space-y-4">
              {/* Cost Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost per Portion (RM)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">RM</span>
                  <input
                    type="number"
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border rounded-lg text-lg font-medium"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Total ingredient cost for one portion
                </p>
              </div>

              {/* Method-specific inputs */}
              {method === 'food_cost' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Food Cost %
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="10"
                      max="60"
                      value={targetFoodCost}
                      onChange={(e) => setTargetFoodCost(e.target.value)}
                      className="flex-1"
                    />
                    <div className="w-20">
                      <input
                        type="number"
                        value={targetFoodCost}
                        onChange={(e) => setTargetFoodCost(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm text-center font-medium"
                      />
                    </div>
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['25', '30', '35', '40', '45'].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => setTargetFoodCost(pct)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          targetFoodCost === pct 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    <Info className="w-3 h-3 inline mr-1" />
                    Lower % = higher price, higher profit. Pizza typically 35-40%.
                  </p>
                </div>
              )}

              {method === 'markup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Markup % on Cost
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="10"
                      max="300"
                      value={markupPercent}
                      onChange={(e) => setMarkupPercent(e.target.value)}
                      className="flex-1"
                    />
                    <div className="w-20">
                      <input
                        type="number"
                        value={markupPercent}
                        onChange={(e) => setMarkupPercent(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm text-center font-medium"
                      />
                    </div>
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
              )}

              {method === 'margin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Profit Margin %
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={targetMargin}
                      onChange={(e) => setTargetMargin(e.target.value)}
                      className="flex-1"
                    />
                    <div className="w-20">
                      <input
                        type="number"
                        value={targetMargin}
                        onChange={(e) => setTargetMargin(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm text-center font-medium"
                      />
                    </div>
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
              )}

              {method === 'target_price' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Selling Price (RM)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">RM</span>
                    <input
                      type="number"
                      step="0.01"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border rounded-lg text-lg font-medium"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleCalculate}
                disabled={!cost || loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Calculator className="w-4 h-4" />
                {loading ? 'Calculating...' : 'Calculate Price'}
              </button>
            </div>
          </div>
        </div>

        {/* Results & Guide */}
        <div className="space-y-4">
          {/* Results Card */}
          {result && (
            <div className="bg-white rounded-xl border-2 border-blue-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-gray-900">Result</h3>
              </div>

              {/* Suggested Price */}
              <div className="text-center p-4 bg-blue-50 rounded-xl mb-4">
                <p className="text-sm text-blue-600 mb-1">Suggested Selling Price</p>
                <p className="text-4xl font-bold text-blue-700">
                  RM {result.suggestedPrice.toFixed(2)}
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-lg border ${getMetricBg(result.foodCostPercent, 'foodcost')}`}>
                  <p className="text-xs text-gray-500">Food Cost %</p>
                  <p className={`text-lg font-bold ${getMetricColor(result.foodCostPercent, 'foodcost')}`}>
                    {result.foodCostPercent.toFixed(1)}%
                  </p>
                </div>
                <div className={`p-3 rounded-lg border ${getMetricBg(result.marginPercent, 'margin')}`}>
                  <p className="text-xs text-gray-500">Profit Margin</p>
                  <p className={`text-lg font-bold ${getMetricColor(result.marginPercent, 'margin')}`}>
                    {result.marginPercent.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500">Markup on Cost</p>
                  <p className="text-lg font-bold text-gray-700">
                    {result.markupPercentActual.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500">Profit per Portion</p>
                  <p className="text-lg font-bold text-green-600">
                    +RM {result.profit.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Target Price Analysis */}
              {result.targetPriceAnalysis && (
                <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm font-medium text-orange-800 mb-2">
                    Analysis for RM {result.targetPrice?.toFixed(2)}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Food Cost</p>
                      <p className="text-sm font-bold text-orange-700">
                        {result.targetPriceAnalysis.foodCostPercent.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Margin</p>
                      <p className="text-sm font-bold text-orange-700">
                        {result.targetPriceAnalysis.marginPercent.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Profit</p>
                      <p className="text-sm font-bold text-orange-700">
                        RM {result.targetPriceAnalysis.profit.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Food Cost Guide */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              Food Cost % Guide
            </h3>
            <div className="space-y-2">
              {FOOD_COST_GUIDE.map((guide) => (
                <div key={guide.range} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <span className="text-sm text-gray-600">{guide.type}</span>
                  <span className={`text-sm font-bold ${guide.color}`}>{guide.range}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Formula Reference */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Formula Reference</h3>
            <div className="space-y-3 text-sm">
              <div className="p-2 bg-white rounded-lg">
                <p className="font-medium text-gray-700">Food Cost % (Industry Standard)</p>
                <p className="text-gray-500 text-xs mt-1">Price = Cost ÷ (Food Cost% / 100)</p>
              </div>
              <div className="p-2 bg-white rounded-lg">
                <p className="font-medium text-gray-700">Profit Margin</p>
                <p className="text-gray-500 text-xs mt-1">Price = Cost ÷ (1 - Margin%)</p>
              </div>
              <div className="p-2 bg-white rounded-lg">
                <p className="font-medium text-gray-700">Markup on Cost</p>
                <p className="text-gray-500 text-xs mt-1">Price = Cost × (1 + Markup%)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};