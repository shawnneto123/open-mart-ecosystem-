import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle } from 'lucide-react';
import useCartStore from '../stores/cartStore';
import useOrderStore from '../stores/orderStore';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../utils/supabaseClient';
import { getAvailablePaymentMethods, getWhatsAppLink, generateWhatsAppPaymentRequest } from '../utils/paymentIntegration';
import { generateWhatsAppMessage } from '../utils/whatsappIntegration';
import { ABUJA_DISTRICTS, getDeliveryRate } from '../utils/deliveryHelper';

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { createOrder } = useOrderStore();
  const user = useAuthStore((state) => state.user);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const [selectedDistrict, setSelectedDistrict] = useState('Wuse I & II');
  const [selectedPayment, setSelectedPayment] = useState('bank_transfer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isPaystackSuccess, setIsPaystackSuccess] = useState(false);

  useEffect(() => {
    if (!user?.id || !supabase) return;

    let isMounted = true;

    const syncProfileFromSupabase = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!isMounted) return;

      if (error) {
        console.warn('Unable to fetch profile for checkout from Supabase:', error);
        return;
      }

      if (!data) return;

      setFormData((prev) => ({
        ...prev,
        name: data.name || prev.name || user?.name || '',
        email: data.email || prev.email || user?.email || '',
        phone: data.phone || prev.phone || '',
        address: data.address || prev.address || '',
      }));
    };

    void syncProfileFromSupabase();

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.name, user?.email]);

  const subtotal = getTotalPrice();
  const tax = subtotal * 0.075;
  const shipping = getDeliveryRate(selectedDistrict);
  const total = subtotal + tax + shipping;
  const paymentMethods = getAvailablePaymentMethods();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.phone.trim()) return 'Phone number is required';
    if (!formData.address.trim()) return 'Address is required';
    if (!selectedDistrict) return 'Please select your Abuja delivery district';
    if (items.length === 0) return 'Cart is empty';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const normalizedCustomerInfo = {
        name: formData.name.trim(),
        email: (formData.email || user?.email || '').trim().toLowerCase(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: selectedDistrict,
      };

      if (selectedPayment === 'paystack') {
        const PaystackPop = (await import('@paystack/inline-js')).default;
        const paystack = new PaystackPop();
        
        paystack.newTransaction({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
          email: normalizedCustomerInfo.email || user?.email || "customer@openmart.com",
          amount: Math.round(total * 100), // Convert to Kobo
          currency: "NGN",
          ref: `OM-${Date.now()}`,
          onSuccess: async (transaction) => {
            try {
              await createOrder({
                items,
                subtotal,
                tax,
                shippingCost: shipping,
                total,
                customerInfo: normalizedCustomerInfo,
                paymentMethod: 'Paystack',
                status: 'Paid',
                paymentStatus: 'paid',
                reference: transaction.reference,
                notes: `Paystack Reference: ${transaction.reference}`
              });

              clearCart();
              setIsPaystackSuccess(true);
              setSuccess(true);
            } catch (err) {
              console.error('Failed to register order after Paystack payment:', err);
              setError('Payment was successful, but we failed to record your order. Please contact support with reference: ' + transaction.reference);
            } finally {
              setLoading(false);
            }
          },
          onCancel: () => {
            console.log('Paystack payment cancelled.');
            setLoading(false);
          }
        });
        return;
      }

      // Create order for other payment methods
      const order = await createOrder({
        items,
        subtotal,
        tax,
        shippingCost: shipping,
        total,
        customerInfo: normalizedCustomerInfo,
        paymentMethod: selectedPayment,
      });

      // Generate WhatsApp message
      const confirmMessage = generateWhatsAppMessage(order);
      
      const bankDetails = {
        bankName: import.meta.env.VITE_BANK_NAME || 'Moniepoint',
        accountNumber: import.meta.env.VITE_BANK_ACCOUNT || '8091994873',
        accountName: import.meta.env.VITE_BANK_ACCOUNT_NAME || 'Shawn Neto-Umeano',
      };
      const paymentMessage = generateWhatsAppPaymentRequest(order, bankDetails);

      // Create WhatsApp links
      const phoneNumber = import.meta.env.VITE_WHATSAPP_BUSINESS_NUMBER || import.meta.env.VITE_WHATSAPP_PHONE || import.meta.env.VITE_BUSINESS_PHONE || '07077760403';
      const confirmLink = getWhatsAppLink(phoneNumber, confirmMessage);
      const paymentLink = getWhatsAppLink(phoneNumber, paymentMessage);

      setSuccess(true);

      // Clear cart
      setTimeout(() => {
        clearCart();

        // Handle different payment methods
        switch (selectedPayment) {
          case 'whatsapp':
          case 'bank_transfer':
          case 'opay':
          case 'palmpay':
            // Open WhatsApp with payment details
            window.open(paymentLink, '_blank');
            break;
          case 'flutterwave':
            // These would require additional setup
            navigate(`/payment/${order.id}?method=${selectedPayment}`);
            return;
          default:
            break;
        }

        navigate('/orders', { state: { orderId: order.id } });
      }, 1500);
    } catch (error) {
      console.error('🔴 Checkout Order Submission Failed:', error);
      alert('Failed to place order: ' + (error?.message || error));
      setError(error?.message || 'Failed to create order');
      setLoading(false);
    }
  };

  if (items.length === 0 && !success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Empty Cart</h2>
          <p className="text-gray-600 mb-6">Please add items before checkout</p>
          <button
            onClick={() => navigate('/')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {isPaystackSuccess ? 'Payment Successful!' : 'Order Placed!'}
          </h2>
          <p className="text-gray-600 mb-4">
            {isPaystackSuccess 
              ? 'Thank you! Your payment has been successfully processed and verified via Paystack.' 
              : 'Your order has been created. Please complete payment via WhatsApp to proceed.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/orders')}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
            >
              View My Orders
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            {/* Billing Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Billing Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="+234 900 000 0000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Address *
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Your delivery address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Abuja District / Area *
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  >
                    {Object.keys(ABUJA_DISTRICTS).map((district) => (
                      <option key={district} value={district}>
                        {district} (₦{ABUJA_DISTRICTS[district]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <label key={method.id} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      value={method.id}
                      checked={selectedPayment === method.id}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="w-4 h-4"
                    />
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900">
                        {method.icon} {method.name}
                      </p>
                      <p className="text-sm text-gray-600">{method.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Dynamic Bank / OPay / PalmPay Transfer details display */}
              {['bank_transfer', 'opay', 'palmpay'].includes(selectedPayment) && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 mt-4 text-sm text-emerald-950">
                  <h3 className="font-bold text-base mb-2">
                    {selectedPayment === 'bank_transfer' && '🏦 Bank Transfer Details'}
                    {selectedPayment === 'opay' && '🟢 OPay Wallet Details'}
                    {selectedPayment === 'palmpay' && '🔴 PalmPay Wallet Details'}
                  </h3>
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold text-emerald-800">
                        {selectedPayment === 'bank_transfer' ? 'Bank Name' : 'Wallet Provider'}:
                      </span>{' '}
                      {selectedPayment === 'bank_transfer' && (import.meta.env.VITE_BANK_NAME || 'Moniepoint')}
                      {selectedPayment === 'opay' && 'OPay'}
                      {selectedPayment === 'palmpay' && 'PalmPay'}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-semibold text-emerald-800">Account Number:</span>{' '}
                      <span className="font-mono bg-white px-2 py-0.5 rounded border font-bold">
                        {selectedPayment === 'bank_transfer' && (import.meta.env.VITE_BANK_ACCOUNT || '8091994873')}
                        {selectedPayment === 'opay' && (import.meta.env.VITE_OPAY_ACCOUNT || '8091994873')}
                        {selectedPayment === 'palmpay' && (import.meta.env.VITE_PALMPAY_ACCOUNT || '9031234567')}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const acc = selectedPayment === 'bank_transfer'
                            ? (import.meta.env.VITE_BANK_ACCOUNT || '8091994873')
                            : (selectedPayment === 'opay'
                                ? (import.meta.env.VITE_OPAY_ACCOUNT || '8091994873')
                                : (import.meta.env.VITE_PALMPAY_ACCOUNT || '9031234567'));
                          navigator.clipboard.writeText(acc);
                          alert('Account details copied!');
                        }}
                        className="ml-2 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition"
                      >
                        Copy
                      </button>
                    </p>
                    <p>
                      <span className="font-semibold text-emerald-800">Account Name:</span>{' '}
                      {selectedPayment === 'bank_transfer' && (import.meta.env.VITE_BANK_ACCOUNT_NAME || 'Shawn Neto-Umeano')}
                      {selectedPayment === 'opay' && (import.meta.env.VITE_OPAY_ACCOUNT_NAME || 'Shawn Neto-Umeano')}
                      {selectedPayment === 'palmpay' && (import.meta.env.VITE_PALMPAY_ACCOUNT_NAME || 'OpenMart Supermarket (PalmPay)')}
                    </p>

                    <div className="border-t border-emerald-200 pt-2 mt-2">
                      <p className="font-semibold mb-1 text-xs text-emerald-900">Instructions:</p>
                      <ul className="list-disc pl-4 space-y-1 text-xs text-emerald-800">
                        <li>Transfer the exact amount shown.</li>
                        <li>Use your name as narration/description.</li>
                        <li>Complete checkout, then send the receipt via WhatsApp.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Complete Order - ₦${total.toLocaleString()}`}
            </button>
          </form>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4 pb-4 border-b max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.itemId} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="font-semibold">₦{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm mb-4 pb-4 border-b">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₦{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (7.5%)</span>
                  <span>₦{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>₦{shipping.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between mb-4">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-green-600">₦{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
