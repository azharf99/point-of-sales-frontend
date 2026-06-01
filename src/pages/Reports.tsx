import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Calendar,
  Filter,
  Download,
  DollarSign
} from 'lucide-react';
import { reportApi } from '../api/reports';
import type { SalesReport } from '../types';
import { cn } from '../utils/cn';
import { useSettingsStore, formatCurrency } from '../store/settingsStore';

const Reports: React.FC = () => {
  const { settings, fetchSettings } = useSettingsStore();
  const today = new Date().toISOString().split('T')[0];
  const [dateRange, setDateRange] = useState({ start: today, end: today });
  const [report, setReport] = useState<SalesReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReport = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await reportApi.getSales(dateRange.start, dateRange.end);
      setReport(res.data);
    } catch (err) {
      console.error('Failed to fetch report', err);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    const init = async () => {
      if (!settings) {
        await fetchSettings();
      }
      await fetchReport();
    };
    init();
  }, [fetchReport, settings, fetchSettings]);

  const stats = [
    { 
      label: 'Gross Revenue', 
      value: formatCurrency(report?.total_sales || 0, settings), 
      icon: DollarSign, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      trend: '+12.5%',
      trendUp: true
    },
    { 
      label: 'Total Orders', 
      value: report?.total_orders?.toString() || '0', 
      icon: ShoppingBag, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      trend: '+5.2%',
      trendUp: true
    },
    { 
      label: 'Avg. Transaction', 
      value: formatCurrency(report?.average_order_value || 0, settings), 
      icon: BarChart3, 
      color: 'text-violet-600', 
      bg: 'bg-violet-50',
      trend: '-2.1%',
      trendUp: false
    },
  ];

  return (
    <div className="space-y-6 lg:space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-slate-900">Sales Reports</h2>
          <p className="text-sm text-slate-500">Analyze your business performance and sales trends.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-sm">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Calendar className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-widest">Select Period:</span>
        </div>
        <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
          <input 
            type="date" 
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="flex-1 md:flex-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <span className="text-slate-400 font-bold">to</span>
          <input 
            type="date" 
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="flex-1 md:flex-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <button 
          onClick={fetchReport}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-95 text-sm"
        >
          <Filter className="w-4 h-4" />
          Apply Filter
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2.5 lg:p-3 rounded-xl", stat.bg, stat.color)}>
                <stat.icon className="w-5 lg:w-6 h-5 lg:h-6" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs lg:text-sm font-bold px-2 py-1 rounded-lg",
                stat.trendUp ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
              )}>
                {stat.trend}
                {stat.trendUp ? <ArrowUpRight className="w-3.5 lg:w-4 h-3.5 lg:h-4" /> : <ArrowDownRight className="w-3.5 lg:w-4 h-3.5 lg:h-4" />}
              </div>
            </div>
            <p className="text-slate-500 text-xs lg:text-sm font-medium mb-1 uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Detailed Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Top Products */}
        <div className="lg:col-span-2 bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900">Performance by Product</h3>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ranked by Revenue</span>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-80">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : report?.top_products && report.top_products.length > 0 ? (
            <div className="space-y-6">
              {report.top_products.map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center font-bold text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate leading-tight mb-1">{item.product_name}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {item.total_quantity} sales
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900 text-lg">{formatCurrency(item.total_sales || 0, settings)}</p>
                    <div className="w-24 sm:w-32 h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                        style={{ width: `${(item.total_sales / (report?.total_sales || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 text-slate-400 text-center">
              <ShoppingBag className="w-16 h-16 opacity-10 mb-4" />
              <p className="font-medium text-lg">No performance data available</p>
              <p className="text-sm">Try selecting a wider date range or check back later.</p>
            </div>
          )}
        </div>

        {/* Breakdown Panel */}
        <div className="space-y-6 lg:space-y-8">
          <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Revenue Breakdown</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Cash Payments</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(report?.cash_payments || 0, settings)}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Snap Payments</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(report?.snap_payments || 0, settings)}</p>
              </div>
              <div className="p-4 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-100">
                <p className="text-xs font-bold opacity-80 uppercase mb-1">Total Discount Given</p>
                <p className="text-xl font-bold">{formatCurrency(report?.total_discount || 0, settings)}</p>
              </div>
            </div>
          </div>

          {report?.sales_by_order_type && (
            <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Order Types Analytics</h3>
              <div className="space-y-4">
                {[
                  { key: 'dine_in', label: 'Dine-In', color: 'bg-blue-500' },
                  { key: 'take_away', label: 'Take Away', color: 'bg-orange-500' },
                  { key: 'delivery_gojek', label: 'Gojek Delivery', color: 'bg-emerald-500' },
                  { key: 'delivery_grab', label: 'Grab Delivery', color: 'bg-green-600' },
                ].map((type) => {
                  const sales = report.sales_by_order_type?.[type.key] || 0;
                  const count = report.item_count_by_order_type?.[type.key] || 0;
                  const totalForPercentage = Object.values(report.sales_by_order_type || {}).reduce((a, b) => a + b, 0);
                  const percentage = totalForPercentage > 0 ? (sales / totalForPercentage) * 100 : 0;
                  return (
                    <div key={type.key} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>{type.label} ({count} items)</span>
                        <span>{formatCurrency(sales, settings)}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all duration-500", type.color)} 
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-slate-900 p-8 rounded-2xl text-white relative overflow-hidden group">
            <TrendingUp className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5 group-hover:scale-110 transition-transform duration-500" />
            <h3 className="text-lg font-bold mb-2 relative z-10">Intelligence Tip</h3>
            <p className="text-slate-400 text-sm leading-relaxed relative z-10">
              Based on your top 5 products, they account for <strong>75%</strong> of your total revenue. Consider bundling them for loyalty members.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
