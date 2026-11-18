import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { 
  CreditCard, 
  Truck, 
  QrCode, 
  DollarSign, 
  ShieldCheck, 
  Lock, 
  ChevronRight, 
  Loader2
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ordersApi } from '../../services/api';

export const CheckoutPage: React.FC = () => {
  const { cart, fetchCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Form State
  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [street, setStreet] = useState('');
  const [ward, setWard] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('Ho Chi Minh City');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<number>(2); // 2 = CreditCard, 3 = MoMo, 4 = VNPay, 1 = COD
  const [submitting, setSubmitting] = useState(false);

  // Credit Card mock inputs
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8921');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('742');

  useEffect(() => {
    if (!cart?.items || cart.items.length === 0) {
      navigate('/cart');
      return;
    }

    if (user) {
      setRecipientName(`${user.firstName} ${user.lastName}`.trim());
      if (user.phoneNumber) setPhoneNumber(user.phoneNumber);
    }
  }, [user, cart]);

  const handleQuickPrefill = () => {
    setRecipientName('Alex Morgan');
    setPhoneNumber('+84 988 765 432');
    setStreet('123 Nguyen Hue Boulevard');
    setWard('Ben Nghe Ward');
    setDistrict('District 1');
    setCity('Ho Chi Minh City');
    setNotes('Please leave package at front reception if I am not available.');
    toast.info('Autofilled demo shipping address!');
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.info('Please sign in or create an account to finalize your order.');
      navigate('/login');
      return;
    }

    if (!recipientName.trim() || !phoneNumber.trim() || !street.trim() || !city.trim()) {
      toast.error('Please fill in all required shipping address fields.');
      return;
    }

    const fullAddress = `${street.trim()}, ${ward ? ward.trim() + ', ' : ''}${district ? district.trim() + ', ' : ''}${city.trim()}`;

    setSubmitting(true);
    try {
      const res = await ordersApi.createOrder({
        recipientName: recipientName.trim(),
        phoneNumber: phoneNumber.trim(),
        shippingAddress: fullAddress,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      if (res.success && res.data) {
        // Fire celebration confetti!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        toast.success('Order placed successfully!');
        await fetchCart(); // Refresh cart to empty
        navigate(`/orders/confirmation/${res.data.id}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to place order. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = cart?.subtotal ?? 0;
  const shippingFee = subtotal >= 100 ? 0 : 10.0;
  const total = subtotal + shippingFee;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Express Checkout</h1>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>256-bit encrypted checkout with automated database inventory locking</span>
        </p>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Form: Shipping & Payment */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Step 1: Shipping Address */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-subtle space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">1</span>
                <h3 className="font-extrabold text-base text-slate-900">Shipping Details</h3>
              </div>
              <button
                type="button"
                onClick={handleQuickPrefill}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1 rounded-full transition-colors"
              >
                Autofill Demo Address
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Recipient Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="+84 988 765 432"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700">Street Address *</label>
                <input
                  type="text"
                  required
                  placeholder="House number, building name, street name"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Ward / Commune</label>
                <input
                  type="text"
                  placeholder="Ben Nghe Ward"
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">District</label>
                <input
                  type="text"
                  placeholder="District 1"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700">City / Province *</label>
                <input
                  type="text"
                  required
                  placeholder="Ho Chi Minh City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700">Delivery Instructions / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional delivery notes, gate codes, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Payment Method */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-subtle space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">2</span>
              <h3 className="font-extrabold text-base text-slate-900">Payment Gateway Simulation</h3>
            </div>

            {/* Payment Method Selector Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod(2)}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                  paymentMethod === 2
                    ? 'border-brand-600 bg-brand-50/60 shadow-sm text-brand-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs font-bold">Credit Card</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod(3)}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                  paymentMethod === 3
                    ? 'border-pink-500 bg-pink-50/60 shadow-sm text-pink-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <QrCode className="w-5 h-5 text-pink-600" />
                <span className="text-xs font-bold">MoMo QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod(4)}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                  paymentMethod === 4
                    ? 'border-blue-500 bg-blue-50/60 shadow-sm text-blue-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <QrCode className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-bold">VNPay QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod(1)}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                  paymentMethod === 1
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-sm text-emerald-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold">Cash On Delivery</span>
              </button>
            </div>

            {/* Payment Details Panel */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/70">
              {paymentMethod === 2 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Simulated Visa / MasterCard</span>
                    <span className="text-emerald-600 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> 3D-Secure Sandbox
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-3">
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase">Expiry</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase">CVV</label>
                      <input
                        type="text"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(paymentMethod === 3 || paymentMethod === 4) && (
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white p-2 rounded-xl border border-slate-200 shadow-subtle shrink-0 flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-slate-800" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">
                      {paymentMethod === 3 ? 'MoMo E-Wallet Sandbox' : 'VNPay QR Code Sandbox'}
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Instant transaction verification. Order confirmation will activate automatically upon clicking "Place Order".
                    </p>
                  </div>
                </div>
              )}

              {paymentMethod === 1 && (
                <div className="flex items-center gap-3 text-slate-700">
                  <Truck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-xs leading-relaxed">
                    Pay securely in cash or mobile card terminal upon physical package arrival at your doorstep.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Summary Sidebar */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-subtle space-y-6">
          <h3 className="font-extrabold text-base text-slate-900 pb-3 border-b border-slate-100">
            Order Review ({cart?.totalItems} items)
          </h3>

          {/* Mini items list */}
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {cart?.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b border-slate-50">
                <img
                  src={item.productImageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=150&q=80'}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover bg-slate-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h5 className="text-xs font-bold text-slate-900 truncate">{item.productName}</h5>
                  <p className="text-[11px] text-slate-400">Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}</p>
                </div>
                <span className="text-xs font-extrabold text-slate-900">${item.totalPrice.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Cost breakdown */}
          <div className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping Fee</span>
              <span className="font-semibold text-slate-900">
                {shippingFee === 0 ? <span className="text-emerald-600 uppercase text-[10px] font-bold">Free</span> : `$${shippingFee.toFixed(2)}`}
              </span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between text-base font-black text-slate-900">
              <span>Total Payable</span>
              <span className="text-brand-600">${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-brand-500/25 transition-all hover:scale-[1.01]"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Order...</span>
              </>
            ) : (
              <>
                <span>Complete Purchase (${total.toFixed(2)})</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[10px] text-slate-400 text-center">
            By clicking Complete Purchase, you authorize ShopAI to process this simulated transaction under our Terms of Service.
          </p>
        </div>

      </form>
    </div>
  );
};
