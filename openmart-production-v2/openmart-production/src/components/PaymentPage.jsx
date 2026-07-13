import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import useOrderStore from '../stores/orderStore';
import { paymentConfig, initializePaystackPayment, initiatePaystackPayment } from '../utils/paymentIntegration';
import { AlertCircle, CheckCircle, CreditCard, ShoppingBag, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const method = searchParams.get('method') || 'paystack';
  
  const getOrder = useOrderStore((state) => state.getOrder);
  const updatePaymentStatus = useOrderStore((state) => state.updatePaymentStatus);
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);

  const order = getOrder(orderId);

  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const paystackPublicKey = paymentConfig.paystack.publicKey;
  const isKeyConfigured = !!paystackPublicKey && paystackPublicKey !== 'pk_live_xxxxx';

  useEffect(() => {
    if (!order) return;
    
    // If order is already paid, show success immediately
    if (order.paymentStatus === 'paid') {
      setPaymentSuccess(true);
      return;
    }

    if (method === 'paystack') {
      if (!isKeyConfigured) {
        setError('Paystack public key is not configured in settings. Automated checkout is in Demo mode.');
        return;
      }

      setLoading(true);
      initializePaystackPayment({ publicKey: paystackPublicKey })
        .then(() => {
          setSdkReady(true);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load Paystack payment gate.');
          setLoading(false);
        });
    }
  }, [order, method, paystackPublicKey, isKeyConfigured]);

  const handlePaynow = async () => {
    if (!order || !sdkReady) return;
    setLoading(true);
    setError('');

    try {
      const response = await initiatePaystackPayment(order, { publicKey: paystackPublicKey });
      if (response.status === 'success') {
        // Mark payment successful in store
        updatePaymentStatus(order.id, 'paid');
        updateOrderStatus(order.id, 'confirmed');
        setPaymentSuccess(true);
      } else {
        setError('Payment verification failed.');
      }
    } catch (err) {
      setError(err.message || 'Payment window closed or cancelled.');
    } finally {
      setLoading(false);
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">The requested order does not exist or has been deleted.</p>
          <Link to="/" className="inline-block bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 transition">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-green-100">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Thank you! Your payment for order <span className="font-mono font-bold text-gray-800">{order.id}</span> has been confirmed.
          </p>
          
          <div className="bg-green-50 rounded-2xl p-4 border border-green-100 mb-6 text-left text-sm text-green-950 space-y-1">
            <p><span className="font-semibold text-green-800">Amount Paid:</span> ₦{order.total.toLocaleString()}</p>
            <p><span className="font-semibold text-green-800">Payment Provider:</span> Paystack Checkout</p>
            <p><span className="font-semibold text-green-800">Reference ID:</span> {order.id}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/orders')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition shadow-md shadow-green-100"
            >
              View Order History
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        
        {/* Back Link */}
        <Link to="/checkout" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-6 font-semibold">
          <ArrowLeft size={18} />
          Back to Checkout
        </Link>

        {/* Card Panel */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white text-center">
            <CreditCard className="w-12 h-12 mx-auto mb-2" />
            <h1 className="text-2xl font-bold">Secure Payment Portal</h1>
            <p className="text-green-100 text-sm mt-1">Complete your purchase using Paystack</p>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Status alerts */}
            {error && (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs flex gap-2.5 items-start">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Notice</p>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Order Info Card */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200 text-sm">
                <span className="text-gray-500">Order ID:</span>
                <span className="font-mono font-bold text-gray-800">{order.id}</span>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-gray-600">
                    <span>{item.name} x{item.quantity}</span>
                    <span className="font-semibold text-gray-800">₦{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Fee Breakdown */}
              <div className="pt-3 border-t border-gray-200 text-xs space-y-1.5 text-gray-500">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₦{order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (VAT 7.5%)</span>
                  <span>₦{order.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>₦{order.shippingCost.toLocaleString()}</span>
                </div>
              </div>

              {/* Total */}
              <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="font-bold text-gray-900 text-sm">Total Due:</span>
                <span className="text-xl font-extrabold text-green-600">₦{order.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Pay Button */}
            {method === 'paystack' && isKeyConfigured ? (
              <button
                onClick={handlePaynow}
                disabled={loading || !sdkReady}
                className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-green-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    <span>Pay ₦{order.total.toLocaleString()} Now</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl p-4 text-xs">
                  <p className="font-bold mb-1">📋 Demo Sandbox Mode Active</p>
                  <p className="text-blue-800">Because there are no production Paystack keys, you can mock-simulate a successful payment to test order updates.</p>
                </div>
                <button
                  onClick={() => {
                    setLoading(true);
                    setTimeout(() => {
                      updatePaymentStatus(order.id, 'paid');
                      updateOrderStatus(order.id, 'confirmed');
                      setPaymentSuccess(true);
                      setLoading(false);
                    }, 1200);
                  }}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Simulate Sandbox Success</span>
                  )}
                </button>
              </div>
            )}

            {/* Cancel Checkout */}
            <button
              onClick={() => navigate('/orders')}
              disabled={loading}
              className="w-full border border-gray-200 text-gray-500 font-semibold py-3 rounded-xl hover:bg-gray-50 hover:text-gray-700 transition text-sm text-center"
            >
              Cancel Payment & View Orders
            </button>
            
          </div>
        </div>
      </div>
    </div>
  );
}
