import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, ShoppingBag } from 'lucide-react';
import { ordersApi } from '../../services/api';
import { Order } from '../../types';
import { useToast } from '../../context/ToastContext';

export const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const toast = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await ordersApi.getMyOrders(1, 50);
      if (res.success && res.data) {
        setOrders(res.data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancel = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const res = await ordersApi.cancelOrder(orderId, 'Cancelled from Order History dashboard');
      if (res.success) {
        toast.info('Order cancelled.');
        fetchOrders();
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to cancel order.';
      toast.error(msg);
    }
  };

  const filteredOrders = statusFilter === 'All'
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  const statusTabs = ['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Order History</h1>
          <p className="text-xs text-slate-500 mt-1">Review past orders, status timelines, and tracking receipts</p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-full text-xs font-bold hover:bg-brand-600 transition-colors"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Browse Products</span>
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === tab
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-subtle space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No orders found</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {statusFilter === 'All'
              ? 'You have not placed any orders yet. Begin exploring our tech collection!'
              : `You have no orders currently in '${statusFilter}' status.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-subtle hover:border-brand-200 transition-colors space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 font-bold shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-black text-slate-900">{order.orderNumber}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
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
                  <span className="text-base font-black text-slate-900">${order.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Items row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <img
                      src={item.productImageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=150&q=80'}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover bg-white shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-slate-900 truncate">{item.productName}</h5>
                      <p className="text-[10px] text-slate-400">Qty: {item.quantity} • ${item.unitPrice.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 text-[11px]">
                  Recipient: <strong className="text-slate-700">{order.recipientName}</strong>
                </span>

                <div className="flex items-center gap-2">
                  {(order.status === 'Pending' || order.status === 'Confirmed') && (
                    <button
                      onClick={() => handleCancel(order.id)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      Cancel Order
                    </button>
                  )}
                  <Link
                    to={`/orders/confirmation/${order.id}`}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-slate-900 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    <span>View Receipt</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
