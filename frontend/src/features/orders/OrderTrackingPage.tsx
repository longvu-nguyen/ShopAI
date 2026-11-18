import React, { useState } from 'react';
import { Search, Package, Clock, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { ordersApi } from '../../services/api';
import { Order, OrderStatus } from '../../types';

export const OrderTrackingPage: React.FC = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const res = await ordersApi.trackOrder(orderNumber.trim());
      if (res.success && res.data) {
        setOrder(res.data);
      }
    } catch (err: any) {
      setError('Could not find order. Please verify your order number (e.g., ORD-20261107-10492).');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: 'Pending', label: 'Order Placed', icon: Clock },
    { title: 'Confirmed', label: 'Processing', icon: CheckCircle2 },
    { title: 'Shipped', label: 'In Transit', icon: Truck },
    { title: 'Delivered', label: 'Delivered', icon: Package },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'Pending': return 0;
      case 'Confirmed': return 1;
      case 'Shipped': return 2;
      case 'Delivered': return 3;
      case 'Cancelled': return -1;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-10">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Live Order Tracking</h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Enter your order reference code (found on your receipt or AI conversation) to view real-time fulfillment status.
        </p>
      </div>

      {/* Search Input */}
      <form onSubmit={handleTrack} className="max-w-lg mx-auto flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            required
            placeholder="e.g. ORD-20261107-10492"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-subtle"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-brand-500/25 transition-all"
        >
          {loading ? 'Tracking...' : 'Track'}
        </button>
      </form>

      {/* Demo helper */}
      <div className="text-center">
        <p className="text-[11px] text-slate-400">
          Try sample seeded orders:{' '}
          <button
            type="button"
            onClick={() => setOrderNumber('ORD-20261107-10492')}
            className="text-brand-600 font-mono underline hover:text-brand-700"
          >
            ORD-20261107-10492
          </button>
          {' '}or{' '}
          <button
            type="button"
            onClick={() => setOrderNumber('ORD-20261117-48201')}
            className="text-brand-600 font-mono underline hover:text-brand-700"
          >
            ORD-20261117-48201
          </button>
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2 max-w-lg mx-auto">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Card */}
      {order && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-premium space-y-8 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="font-mono text-sm font-black text-slate-900">{order.orderNumber}</span>
              <p className="text-xs text-slate-400">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-start sm:self-auto ${
                order.status === 'Cancelled'
                  ? 'bg-rose-100 text-rose-700'
                  : order.status === 'Delivered'
                  ? 'bg-emerald-100 text-emerald-700'
                  : order.status === 'Shipped'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {order.status}
            </span>
          </div>

          {/* Stepper */}
          {order.status !== 'Cancelled' && (
            <div className="grid grid-cols-4 gap-2 pt-2">
              {steps.map((st, idx) => {
                const currentIndex = getStepIndex(order.status);
                const isPast = idx <= currentIndex;
                const Icon = st.icon;

                return (
                  <div key={idx} className="flex flex-col items-center text-center space-y-2">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                        isPast
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${isPast ? 'text-slate-900' : 'text-slate-400'}`}>
                        {st.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {order.trackingNumber && (
            <div className="p-3 bg-slate-50 rounded-xl text-xs flex justify-between">
              <span className="text-slate-500">Carrier Tracking Code:</span>
              <span className="font-mono font-bold text-slate-900">{order.trackingNumber}</span>
            </div>
          )}

          {/* Items */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ordered Gear</h4>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b border-slate-50">
                <img
                  src={item.productImageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=150&q=80'}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold text-slate-900 truncate">{item.productName}</h5>
                  <p className="text-[10px] text-slate-400">Qty: {item.quantity} • ${item.unitPrice.toFixed(2)}</p>
                </div>
                <span className="text-xs font-extrabold text-slate-900">${item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between text-base font-black text-slate-900">
            <span>Total Value</span>
            <span className="text-brand-600">${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
