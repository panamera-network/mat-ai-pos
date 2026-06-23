import { useState, useCallback } from 'react';
import { useAccounting } from '../../hooks/useAccounting';
import type { AccountType, TrialBalanceRow } from '@mat-ai/types';

interface ReportSection {
  title: string;
  type: AccountType;
  items: { code: string; name: string; amount: number }[];
  total: number;
}

export default function FinancialReportsPage() {
  const { getTrialBalance } = useAccounting();
  const [reportType, setReportType] = useState<'PL' | 'BS'>('PL');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [report, setReport] = useState<ReportSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ revenue: 0, cogs: 0, expenses: 0, netProfit: 0, assets: 0, liabilities: 0, equity: 0 });

  const generateReport = useCallback(async () => {
    setLoading(true);
    const res = await getTrialBalance({ asOf: dateRange.to });
    if (res.ok && res.data) {
      const rows: TrialBalanceRow[] = res.data.rows;
      if (reportType === 'PL') {
        const revenue = rows.filter((r: TrialBalanceRow) => r.type === 'REVENUE');
        const cogs = rows.filter((r: TrialBalanceRow) => r.type === 'EXPENSE' && (r.code.startsWith('5') || r.name.includes('COGS')));
        const expenses = rows.filter((r: TrialBalanceRow) => r.type === 'EXPENSE' && !r.code.startsWith('5') && !r.name.includes('COGS'));
        const revenueTotal = revenue.reduce((sum: number, r: TrialBalanceRow) => sum + r.balance, 0);
        const cogsTotal = cogs.reduce((sum: number, r: TrialBalanceRow) => sum + Math.abs(r.balance), 0);
        const expensesTotal = expenses.reduce((sum: number, r: TrialBalanceRow) => sum + Math.abs(r.balance), 0);
        const grossProfit = revenueTotal - cogsTotal;
        const netProfit = grossProfit - expensesTotal;
        setReport([
          { title: 'Hasil (Revenue)', type: 'REVENUE', items: revenue.map((r: TrialBalanceRow) => ({ code: r.code, name: r.name, amount: r.balance })), total: revenueTotal },
          { title: 'Kos Jualan (COGS)', type: 'EXPENSE', items: cogs.map((r: TrialBalanceRow) => ({ code: r.code, name: r.name, amount: Math.abs(r.balance) })), total: cogsTotal },
          { title: 'Untung Kasar (Gross Profit)', type: 'EXPENSE', items: [{ code: '', name: 'Untung Kasar', amount: grossProfit }], total: grossProfit },
          { title: 'Perbelanjaan Operasi (Operating Expenses)', type: 'EXPENSE', items: expenses.map((r: TrialBalanceRow) => ({ code: r.code, name: r.name, amount: Math.abs(r.balance) })), total: expensesTotal },
          { title: 'Untung Bersih (Net Profit)', type: 'REVENUE', items: [{ code: '', name: 'Untung Bersih', amount: netProfit }], total: netProfit },
        ]);
        setSummary({ revenue: revenueTotal, cogs: cogsTotal, expenses: expensesTotal, netProfit, assets: 0, liabilities: 0, equity: 0 });
      } else {
        const assets = rows.filter((r: TrialBalanceRow) => r.type === 'ASSET');
        const liabilities = rows.filter((r: TrialBalanceRow) => r.type === 'LIABILITY');
        const equity = rows.filter((r: TrialBalanceRow) => r.type === 'EQUITY');
        const assetsTotal = assets.reduce((sum: number, r: TrialBalanceRow) => sum + r.balance, 0);
        const liabilitiesTotal = liabilities.reduce((sum: number, r: TrialBalanceRow) => sum + Math.abs(r.balance), 0);
        const equityTotal = equity.reduce((sum: number, r: TrialBalanceRow) => sum + Math.abs(r.balance), 0);
        setReport([
          { title: 'Aset (Assets)', type: 'ASSET', items: assets.map((r: TrialBalanceRow) => ({ code: r.code, name: r.name, amount: r.balance })), total: assetsTotal },
          { title: 'Liabiliti (Liabilities)', type: 'LIABILITY', items: liabilities.map((r: TrialBalanceRow) => ({ code: r.code, name: r.name, amount: Math.abs(r.balance) })), total: liabilitiesTotal },
          { title: 'Ekuiti (Equity)', type: 'EQUITY', items: equity.map((r: TrialBalanceRow) => ({ code: r.code, name: r.name, amount: Math.abs(r.balance) })), total: equityTotal },
        ]);
        setSummary({ revenue: 0, cogs: 0, expenses: 0, netProfit: 0, assets: assetsTotal, liabilities: liabilitiesTotal, equity: equityTotal });
      }
    }
    setLoading(false);
  }, [getTrialBalance, reportType, dateRange]);

  const exportToCsv = () => {
    const rows: string[][] = [];
    rows.push(['Laporan', reportType === 'PL' ? 'Profit & Loss' : 'Balance Sheet']);
    rows.push(['Tempoh', `${dateRange.from} - ${dateRange.to}`]);
    rows.push([]);
    report.forEach((section) => {
      rows.push([section.title, '', '']);
      section.items.forEach((item) => { rows.push([item.code, item.name, item.amount.toFixed(2)]); });
      rows.push(['', 'Jumlah', section.total.toFixed(2)]);
      rows.push([]);
    });
    const csv = rows.map((r) => r.join(',')).join('\\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType === 'PL' ? 'profit-loss' : 'balance-sheet'}-${dateRange.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Laporan Kewangan</h1>
        {report.length > 0 && <button onClick={exportToCsv} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Export CSV</button>}
      </div>
      <div className="flex gap-4 items-center mb-6 bg-white p-4 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Jenis Laporan</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value as 'PL' | 'BS')} className="px-3 py-2 border rounded-lg">
            <option value="PL">Profit & Loss (Untung Rugi)</option>
            <option value="BS">Balance Sheet (Penyata Kedudukan)</option>
          </select>
        </div>
        <div><label className="block text-sm font-medium mb-1">Dari</label><input type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} className="px-3 py-2 border rounded-lg" /></div>
        <div><label className="block text-sm font-medium mb-1">Hingga</label><input type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} className="px-3 py-2 border rounded-lg" /></div>
        <button onClick={generateReport} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mt-6">Generate</button>
      </div>
      {report.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {reportType === 'PL' ? (
            <>
              <div className="bg-green-50 p-4 rounded-lg"><p className="text-sm text-green-600">Jumlah Hasil</p><p className="text-2xl font-bold text-green-700">RM {summary.revenue.toFixed(2)}</p></div>
              <div className="bg-red-50 p-4 rounded-lg"><p className="text-sm text-red-600">Jumlah Perbelanjaan</p><p className="text-2xl font-bold text-red-700">RM {(summary.cogs + summary.expenses).toFixed(2)}</p></div>
              <div className={`p-4 rounded-lg ${summary.netProfit >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}><p className={`text-sm ${summary.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Untung Bersih</p><p className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>RM {summary.netProfit.toFixed(2)}</p></div>
            </>
          ) : (
            <>
              <div className="bg-blue-50 p-4 rounded-lg"><p className="text-sm text-blue-600">Jumlah Aset</p><p className="text-2xl font-bold text-blue-700">RM {summary.assets.toFixed(2)}</p></div>
              <div className="bg-red-50 p-4 rounded-lg"><p className="text-sm text-red-600">Jumlah Liabiliti</p><p className="text-2xl font-bold text-red-700">RM {summary.liabilities.toFixed(2)}</p></div>
              <div className="bg-purple-50 p-4 rounded-lg"><p className="text-sm text-purple-600">Jumlah Ekuiti</p><p className="text-2xl font-bold text-purple-700">RM {summary.equity.toFixed(2)}</p></div>
            </>
          )}
        </div>
      )}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : report.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold">{reportType === 'PL' ? 'Profit & Loss Statement' : 'Balance Sheet'}</h2>
            <p className="text-sm text-gray-500">Tempoh: {new Date(dateRange.from).toLocaleDateString('ms-MY')} - {new Date(dateRange.to).toLocaleDateString('ms-MY')}</p>
          </div>
          {report.map((section, index) => (
            <div key={index} className={index > 0 ? 'border-t' : ''}>
              <div className="px-4 py-3 bg-gray-50"><h3 className="font-semibold">{section.title}</h3></div>
              <table className="w-full">
                <tbody>
                  {section.items.map((item, i) => (
                    <tr key={i} className={`${item.code === '' ? 'bg-gray-50 font-bold' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-2 w-24">{item.code && <span className="font-mono text-sm">{item.code}</span>}</td>
                      <td className="px-4 py-2">{item.name}</td>
                      <td className="px-4 py-2 text-right font-mono">RM {item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 bg-gray-100">
                    <td colSpan={2} className="px-4 py-2 font-bold text-right">Jumlah {section.title}</td>
                    <td className="px-4 py-2 text-right font-mono font-bold">RM {section.total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
          {reportType === 'BS' && (
            <div className="p-4 border-t bg-gray-50">
              <p className="text-center font-medium">Aset = Liabiliti + Ekuiti<br /><span className="font-mono">RM {summary.assets.toFixed(2)} = RM {summary.liabilities.toFixed(2)} + RM {summary.equity.toFixed(2)}</span><br /><span className={`text-sm ${Math.abs(summary.assets - (summary.liabilities + summary.equity)) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>{Math.abs(summary.assets - (summary.liabilities + summary.equity)) < 0.01 ? '✅ Seimbang' : '⚠️ Tidak seimbang'}</span></p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">Pilih jenis laporan dan klik "Generate"</div>
      )}
    </div>
  );
}