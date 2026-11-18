import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  Package, 
  Truck, 
  Clock, 
  MapPin, 
  CreditCard, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { ordersApi } from '../../services/api';
import { Order, OrderStatus } from '../../types';
import { useToast } from '../../context/ToastContext';

export const OrderConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const toast = useToast();

  const fetchOrder = async () => {
    if (!id) return;
    try {
      const res = await ordersApi.getById(id);
      if (res.success && res.data) {
        setOrder(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!window.confirm('Are you sure you want to cancel this order? Stock will be restored immediately.')) return;

    setCancelling(true);
    try {
      const res = await ordersApi.cancelOrder(order.id, 'Customer requested cancellation via confirmation portal');
      if (res.success && res.data) {
        setOrder(res.data);
        toast.info('Order has been cancelled.');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to cancel order.';
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse space-y-4">
          <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto" />
          <div className="h-6 bg-slate-200 rounded-lg w-1/3 mx-auto" />
          <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Order Not Found</h2>
        <Link to="/orders" className="text-xs font-semibold text-brand-600">Return to My Orders</Link>
      </div>
    );
  }

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

  const currentIndex = getStepIndex(order.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      
      {/* Top Success Banner */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto shadow-md">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Order Confirmed!</h1>
        <p className="text-xs text-slate-500">
          Thank you for choosing ShopAI. We have received your order and automated fulfillment is underway.
        </p>
        <div className="inline-block px-4 py-1.5 bg-slate-100 rounded-full text-xs font-mono font-bold text-slate-800">
          Order Number: {order.orderNumber}
        </div>
      </div>

      {/* Order Status Stepper */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="font-extrabold text-sm text-slate-900">Fulfillment Progression</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            order.status === 'Cancelled'
              ? 'bg-rose-100 text-rose-700'
              : order.status === 'Delivered'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-brand-50 text-brand-700'
          }`}>
            {order.status}
          </span>
        </div>

        {order.status === 'Cancelled' ? (
          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>This order was cancelled. Reserved inventory was returned to catalog stock.</span>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 relative">
            {steps.map((st, idx) => {
              const isPast = idx <= currentIndex;
              const isCurrent = idx === currentIndex;
              const Icon = st.icon;

              return (
                <div key={idx} className="flex flex-col items-center text-center space-y-2">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                      isPast
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                        : 'bg-slate-100 text-slate-400'
                    } ${isCurrent ? 'ring-4 ring-brand-100' : ''}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isPast ? 'text-slate-900' : 'text-slate-400'}`}>
                      {st.label}
                    </p>
                    <span className="text-[10px] text-slate-400 hidden sm:inline">{st.title}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {order.trackingNumber && (
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600">Carrier Tracking Code:</span>
            <span className="font-mono font-bold text-slate-900">{order.trackingNumber}</span>
          </div>
        )}
      </div>

      {/* Details & Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Delivery & Payment info */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-subtle space-y-6">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600" />
              <span>Shipping Information</span>
            </h4>
            <p className="text-xs font-semibold text-slate-800">{order.recipientName}</p>
            <p className="text-xs text-slate-500">{order.phoneNumber}</p>
            <p className="text-xs text-slate-600 mt-1">{order.shippingAddress}</p>
            {order.notes && <p className="text-xs text-slate-400 italic mt-2">"{order.notes}"</p>}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-600" />
              <span>Payment Details</span>
            </h4>
            <p className="text-xs text-slate-700">
              Method: <strong>{order.payment?.method || 'Card / E-Wallet'}</strong>
            </p>
            <p className="text-xs text-slate-700 mt-0.5">
              Status: <span className="text-emerald-600 font-bold">{order.payment?.status || 'Completed'}</span>
            </p>
            {order.payment?.transactionCode && (
              <p className="text-[11px] font-mono text-slate-400 mt-1">Txn: {order.payment.transactionCode}</p>
            )}
          </div>

          {/* Cancellation Option */}
          {(order.status === 'Pending' || order.status === 'Confirmed') && (
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors"
              >
                {cancelling ? 'Cancelling...' : 'Cancel This Order'}
              </button>
            </div>
          )}
        </div>

        {/* Items Ordered List */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-subtle space-y-4">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
            Items Ordered ({order.items.length})
          </h4>

          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b border-slate-50">
                <img
                  src={item.productImageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=150&q=80'}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-slate-900 truncate">{item.productName}</h5>
                  <p className="text-[11px] text-slate-400">Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}</p>
                </div>
                <span className="text-xs font-extrabold text-slate-900">${item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 pt-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-semibold text-slate-900">${order.shippingFee.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between text-base font-black text-slate-900">
              <span>Total Paid</span>
              <span className="text-brand-600">${order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link
          to="/orders"
          className="px-6 py-3 bg-white border border-slate-200 text-slate-800 rounded-full text-xs font-bold hover:bg-slate-50 transition-colors shadow-subtle"
        >
          View My Orders History
        </Link>
        <Link
          to="/products"
          className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-bold shadow-lg shadow-brand-500/25 transition-all flex items-center gap-2"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
};
