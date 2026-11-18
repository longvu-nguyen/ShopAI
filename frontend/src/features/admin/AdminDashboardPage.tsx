import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  AlertTriangle, 
  Download, 
  ArrowUpRight, 
  Package, 
  Clock, 
  Layers
} from 'lucide-react';
import { adminApi } from '../../services/api';
import { AdminMetrics, InventoryAlert } from '../../types';
import { useToast } from '../../context/ToastContext';

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const toast = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [metRes, alertRes] = await Promise.all([
        adminApi.getMetrics(),
        adminApi.getLowStockAlerts(5),
      ]);

      if (metRes.success && metRes.data) setMetrics(metRes.data);
      if (alertRes.success && alertRes.data) setAlerts(alertRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load admin metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      await adminApi.exportCsv();
      toast.success('Orders CSV report downloaded successfully!');
    } catch {
      toast.error('Failed to export CSV report.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded-xl w-1/4 mx-auto" />
          <div className="grid grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Find max revenue for chart scaling
  const maxRev = Math.max(...(metrics?.revenueOverTime?.map((r) => r.revenue) || [100]));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Admin Executive Portal</h1>
            <span className="px-2.5 py-0.5 bg-brand-100 text-brand-700 text-[10px] font-black uppercase rounded-full">
              Live Monitor
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Real-time metrics, revenue performance, and inventory health</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-subtle transition-all"
          >
            <Download className="w-4 h-4 text-brand-600" />
            <span>{exporting ? 'Generating CSV...' : 'Export Orders CSV'}</span>
          </button>

          <Link
            to="/admin/products"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <Layers className="w-4 h-4" />
            <span>Manage Products</span>
          </Link>

          <Link
            to="/admin/orders"
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-brand-500/25 transition-colors"
          >
            <Package className="w-4 h-4" />
            <span>Manage Orders</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Revenue */}
        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900">${(metrics?.totalRevenue ?? 0).toFixed(2)}</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              Today: ${(metrics?.todayRevenue ?? 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Card 2: Orders */}
        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Orders</span>
            <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900">{metrics?.totalOrders ?? 0}</h3>
            <p className="text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{metrics?.pendingOrders ?? 0} pending processing</span>
            </p>
          </div>
        </div>

        {/* Card 3: Customers */}
        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customers</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900">{metrics?.totalCustomers ?? 0}</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Active registered accounts
            </p>
          </div>
        </div>

        {/* Card 4: Inventory Alerts */}
        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inventory Health</span>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              (metrics?.lowStockProductCount ?? 0) > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900">{metrics?.lowStockProductCount ?? 0}</h3>
            <p className="text-[11px] text-rose-600 font-semibold mt-1">
              {(metrics?.lowStockProductCount ?? 0) > 0 ? 'Products at or below 5 units' : 'All stock levels healthy'}
            </p>
          </div>
        </div>

      </div>

      {/* Interactive Revenue Chart & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Revenue 7-Day Chart */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-subtle space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Revenue Progression (Past 7 Days)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Automated aggregate daily turnover</p>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-3 pt-6 border-b border-slate-100 pb-2">
            {metrics?.revenueOverTime.map((point, idx) => {
              const heightPercent = maxRev > 0 ? Math.max(12, (point.revenue / maxRev) * 100) : 12;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full flex justify-center">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md pointer-events-none whitespace-nowrap shadow-md z-10">
                      ${point.revenue.toFixed(2)} ({point.orderCount} orders)
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[42px] bg-gradient-to-t from-brand-600 to-indigo-500 rounded-t-xl group-hover:from-brand-500 group-hover:to-indigo-400 transition-all shadow-subtle"
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500">{point.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-slate-900">Stock Reorder Alerts</h3>
            <span className="text-xs text-rose-500 font-bold">{alerts.length} alerts</span>
          </div>

          {alerts.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No inventory alerts. Stock levels are optimal.</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((al) => (
                <div key={al.productId} className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">{al.productName}</h5>
                    <p className="text-[10px] font-mono text-slate-500">SKU: {al.sku}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-rose-600 text-white font-extrabold text-[10px] rounded-full">
                    {al.currentStock} left
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link
            to="/admin/products"
            className="block text-center text-xs font-bold text-brand-600 hover:text-brand-700 pt-2"
          >
            Update Catalog Inventory →
          </Link>
        </div>

      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-extrabold text-base text-slate-900">Recent Customer Transactions</h3>
          <Link to="/admin/orders" className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
            <span>View All Orders</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                <th className="pb-3">Order Number</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics?.recentOrders.map((ro) => (
                <tr key={ro.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 font-mono font-bold text-slate-900">{ro.orderNumber}</td>
                  <td className="py-3 text-slate-700 font-medium">{ro.customerName}</td>
                  <td className="py-3 text-slate-400">{new Date(ro.createdAt).toLocaleDateString()}</td>
                  <td className="py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ro.status === 'Cancelled'
                          ? 'bg-rose-100 text-rose-700'
                          : ro.status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-700'
                          : ro.status === 'Shipped'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ro.status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-extrabold text-slate-900">${ro.totalAmount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
