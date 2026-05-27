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
import type { SalesReport } from '../types';
import { cn } from '../utils/cn';

const Dashboard: React.FC = () => {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await reportApi.getSales(today, today);
      setReport(res.data);
    } catch (err) {
      console.error('Failed to fetch report', err);
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    { 
      label: 'Total Revenue', 
      value: `$${report?.total_sales?.toLocaleString() || '0'}`, 
      icon: TrendingUp, 
      color: 'text-green-600', 
      bg: 'bg-green-100',
      trend: '+12.5%',
      trendUp: true
    },
    { 
      label: 'Orders', 
      value: report?.order_volume?.toString() || '0', 
      icon: ShoppingBag, 
      color: 'text-blue-600', 
      bg: 'bg-blue-100',
      trend: '+5.2%',
      trendUp: true
    },
    { 
      label: 'Avg. Ticket', 
      value: `$${report?.average_ticket?.toLocaleString() || '0'}`, 
      icon: BarChart3, 
      color: 'text-purple-600', 
      bg: 'bg-purple-100',
      trend: '-2.1%',
      trendUp: false
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
          <select className="w-full sm:w-auto bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm">
            <option>Today</option>
            <option>Yesterday</option>
            <option>Last 7 Days</option>
            <option>This Month</option>
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
                    <p className="font-bold text-slate-900 truncate leading-tight mb-0.5">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.quantity} units sold</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900">${(item.revenue || 0).toLocaleString()}</p>
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
          <div className="flex flex-col items-center justify-center h-64 lg:h-72 text-slate-400 text-center">
            <TrendingUp className="w-12 h-12 opacity-10 mb-4" />
            <p className="text-sm font-medium">Recent transactions will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
