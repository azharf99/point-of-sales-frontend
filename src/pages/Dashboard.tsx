import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { reportApi } from '../api/reports';
import { transactionApi } from '../api/transactions';
import { useSettingsStore, formatCurrency } from '../store/settingsStore';
import type { SalesReport, Transaction } from '../types';
import { cn } from '../utils/cn';

const Dashboard: React.FC = () => {
  const { settings, fetchSettings } = useSettingsStore();
  const [report, setReport] = useState<SalesReport | null>(null);
  const [compReport, setCompReport] = useState<SalesReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | '7days' | 'month'>('today');
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  const fetchReport = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      let startDate = todayStr;
      let endDate = todayStr;

      if (dateFilter === 'yesterday') {
        const yesterday = new Date(Date.now() - 86400000);
        startDate = yesterday.toISOString().split('T')[0];
        endDate = startDate;
      } else if (dateFilter === '7days') {
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
        startDate = sevenDaysAgo.toISOString().split('T')[0];
      } else if (dateFilter === 'month') {
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        startDate = firstDayOfMonth.toISOString().split('T')[0];
      }

      // Compute comparison period
      let compStart = '';
      let compEnd = '';
      
      const startMs = new Date(startDate).getTime();
      const endMs = new Date(endDate).getTime();
      const duration = endMs - startMs + 86400000;

      const compStartObj = new Date(startMs - duration);
      const compEndObj = new Date(endMs - duration);
      compStart = compStartObj.toISOString().split('T')[0];
      compEnd = compEndObj.toISOString().split('T')[0];

      const [res, compRes] = await Promise.all([
        reportApi.getSales(startDate, endDate),
        reportApi.getSales(compStart, compEnd).catch(() => ({ data: null }))
      ]);

      setReport(res.data);
      setCompReport(compRes.data || null);
    } catch (err) {
      console.error('Failed to fetch report', err);
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter]);

  const fetchRecentTransactions = React.useCallback(async () => {
    setIsLoadingTransactions(true);
    try {
      const res = await transactionApi.getAll(1, 5);
      if (res.data && 'items' in res.data) {
        setRecentTransactions(res.data.items || []);
      } else {
        setRecentTransactions(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error('Failed to fetch recent transactions', err);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!settings) {
        await fetchSettings();
      }
    };
    init();
  }, [settings, fetchSettings]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (active) {
        fetchReport();
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [fetchReport]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      await Promise.resolve();
      if (active) {
        fetchRecentTransactions();
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [fetchRecentTransactions]);

  const getTrend = (type: 'revenue' | 'orders' | 'ticket') => {
    if (!report || !compReport) return { label: '0.0%', up: true };
    
    let current = 0;
    let previous = 0;
    
    if (type === 'revenue') {
      current = report.total_sales;
      previous = compReport.total_sales;
    } else if (type === 'orders') {
      current = report.order_volume;
      previous = compReport.order_volume;
    } else if (type === 'ticket') {
      current = report.average_ticket;
      previous = compReport.average_ticket;
    }
    
    if (previous === 0) {
      return current > 0 ? { label: '+100.0%', up: true } : { label: '0.0%', up: true };
    }
    
    const pct = ((current - previous) / previous) * 100;
    const label = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
    return { label, up: pct >= 0 };
  };

  const stats = [
    { 
      label: 'Total Revenue', 
      value: formatCurrency(report?.total_sales || 0, settings), 
      icon: TrendingUp, 
      color: 'text-green-600', 
      bg: 'bg-green-100',
      trend: getTrend('revenue').label,
      trendUp: getTrend('revenue').up
    },
    { 
      label: 'Orders', 
      value: report?.order_volume?.toString() || '0', 
      icon: ShoppingBag, 
      color: 'text-blue-600', 
      bg: 'bg-blue-100',
      trend: getTrend('orders').label,
      trendUp: getTrend('orders').up
    },
    { 
      label: 'Avg. Ticket', 
      value: formatCurrency(report?.average_ticket || 0, settings), 
      icon: BarChart3, 
      color: 'text-purple-600', 
      bg: 'bg-purple-100',
      trend: getTrend('ticket').label,
      trendUp: getTrend('ticket').up
    },
  ];

  return (
    <div className="space-y-6 lg:space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-slate-900">Dashboard Overview</h2>
          <p className="text-sm text-slate-500">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex shrink-0">
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as 'today' | 'yesterday' | '7days' | 'month')}
            className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="7days">Last 7 Days</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2.5 lg:p-3 rounded-xl", stat.bg, stat.color)}>
                <stat.icon className="w-5 lg:w-6 h-5 lg:h-6" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs lg:text-sm font-bold px-2 py-1 rounded-lg",
                stat.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
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

      {/* Charts / Tables Placeholder */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base lg:text-lg font-bold text-slate-900">Top Selling Products</h3>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64 lg:h-72">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : report?.top_products && report.top_products.length > 0 ? (
            <div className="space-y-5 lg:space-y-6">
              {report.top_products.map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-10 lg:w-12 h-10 lg:h-12 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate leading-tight mb-0.5">{item.product_name}</p>
                    <p className="text-xs text-slate-500">{item.total_quantity} units sold</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900">{formatCurrency(item.total_sales || 0, settings)}</p>
                    <div className="w-16 sm:w-24 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                        style={{ width: `${(item.revenue / (report?.total_sales || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 lg:h-72 text-slate-400 text-center">
              <ShoppingBag className="w-12 h-12 opacity-10 mb-4" />
              <p className="text-sm font-medium">No sales data available for this period.</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base lg:text-lg font-bold text-slate-900">Recent Transactions</h3>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
              History <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {isLoadingTransactions ? (
            <div className="flex items-center justify-center h-64 lg:h-72">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : recentTransactions.length > 0 ? (
            <div className="space-y-5 lg:space-y-6">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-4 group">
                  <div className={cn(
                    "p-2.5 rounded-xl flex items-center justify-center shrink-0",
                    tx.payment_status === 'success' ? "bg-emerald-50 text-emerald-600" :
                    tx.payment_status === 'failed' ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                  )}>
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate leading-tight mb-0.5">Invoice #{tx.invoice_number || tx.id}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(tx.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {tx.payment_method.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900">{formatCurrency(tx.total, settings)}</p>
                    <span className={cn(
                      "inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1",
                      tx.payment_status === 'success' ? "bg-emerald-100 text-emerald-700" :
                      tx.payment_status === 'failed' ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {tx.payment_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 lg:h-72 text-slate-400 text-center">
              <TrendingUp className="w-12 h-12 opacity-10 mb-4" />
              <p className="text-sm font-medium">Recent transactions will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
