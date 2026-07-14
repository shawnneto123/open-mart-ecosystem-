import { useState, useEffect, useMemo } from 'react';
import { Order, updateOrderStatus, updatePaymentStatus } from '../services/supabase';
import { formatNaira } from '../utils/helpers';
import { formatDistanceToNow } from 'date-fns';
import { 
  FileText, ShoppingBag, User, Phone, Mail, MapPin, 
  CreditCard, Calendar, Printer, Volume2, VolumeX, BellRing 
} from 'lucide-react';

interface OrderMonitorProps {
  orders: Order[];
  onOrderUpdated: () => void;
  isLoading: boolean;
  soundEnabled: boolean;
  onSoundToggle: (enabled: boolean) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200 ring-1 ring-yellow-400/20',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-400/20',
  completed: 'bg-green-50 text-green-700 border-green-200 ring-1 ring-green-400/20',
  cancelled: 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-400/20',
};

const paymentStatusColors = {
  unpaid: 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-300',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-300',
  failed: 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-300',
};

export default function OrderMonitor({ orders, onOrderUpdated, isLoading, soundEnabled, onSoundToggle }: OrderMonitorProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newOrderAlert, setNewOrderAlert] = useState<boolean>(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Auto-select first order whenever the list changes
  useEffect(() => {
    if (orders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(orders[0].id);
    }
  }, [orders, selectedOrderId]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) =>
      statusFilter === 'all' ? true : order.status === statusFilter
    );
  }, [orders, statusFilter]);

  // Current selected order detail
  const currentOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  // Handle status update
  const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, status);
      onOrderUpdated();
    } catch (err) {
      alert('Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle payment status update
  const handleUpdatePayment = async (orderId: string, paymentStatus: Order['paymentStatus']) => {
    setUpdatingId(orderId);
    try {
      await updatePaymentStatus(orderId, paymentStatus);
      onOrderUpdated();
    } catch (err) {
      alert('Failed to update payment status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Printing invoice layout
  const handlePrintInvoice = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow popups to print invoices.');
      return;
    }

    const itemsRows = order.items.map((item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₦${item.price.toLocaleString()}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₦${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    const invoiceHtml = `
      <html>
        <head>
          <title>Receipt - ${order.id}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #1f2937; margin: 40px; line-height: 1.5; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: 800; color: #059669; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; }
            .meta div { flex: 1; }
            .meta-right { text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
            th { background-color: #f9fafb; padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; }
            .totals { float: right; width: 300px; font-size: 14px; }
            .totals div { display: flex; justify-content: space-between; padding: 5px 0; }
            .totals .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #e5e7eb; padding-top: 10px; margin-top: 5px; color: #059669; }
            .footer { text-align: center; margin-top: 80px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            @media print {
              body { margin: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">🛒 OpenMart Supermarket</div>
            <div style="font-size: 14px; color: #6b7280; margin-top: 5px;">Abuja, Nigeria</div>
            <h2 style="margin-top: 20px; font-size: 20px; font-weight: 700; color: #111827;">SALES RECEIPT</h2>
          </div>
          
          <div class="meta">
            <div>
              <strong>Customer Billing:</strong><br />
              Name: ${order.customerInfo?.name || 'Guest'}<br />
              Phone: ${order.customerInfo?.phone || 'N/A'}<br />
              Email: ${order.customerInfo?.email || 'N/A'}<br />
              Address: ${order.customerInfo?.address || 'N/A'}, Abuja
            </div>
            <div class="meta-right">
              <strong>Order Details:</strong><br />
              Order ID: <strong>${order.id}</strong><br />
              Date: ${order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}<br />
              Status: ${(order.status || 'pending').toUpperCase()}<br />
              Payment Status: ${(order.paymentStatus || 'unpaid').toUpperCase()} (${order.paymentMethod || 'N/A'})
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="totals">
            <div>
              <span>Subtotal:</span>
              <span>₦${(order.subtotal || 0).toLocaleString()}</span>
            </div>
            <div>
              <span>VAT (7.5%):</span>
              <span>₦${(order.tax || 0).toLocaleString()}</span>
            </div>
            <div>
              <span>Delivery Fee:</span>
              <span>₦${(order.shippingCost || 0).toLocaleString()}</span>
            </div>
            <div class="grand-total">
              <span>Total Paid:</span>
              <span>₦${(order.total || 0).toLocaleString()}</span>
            </div>
          </div>

          <div style="clear: both;"></div>

          <div class="footer">
            <p>Thank you for shopping with OpenMart!</p>
            <p>For inquiries, contact support at 07077760403</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-14rem)] overflow-hidden animate-fadeIn">
      {/* Left List Pane */}
      <div className="w-full lg:w-5/12 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        {/* Banner Alert for new orders */}
        {newOrderAlert && (
          <div className="bg-emerald-600 text-white px-4 py-3 flex items-center justify-between text-sm font-semibold animate-pulse">
            <span className="flex items-center gap-2">
              <BellRing className="w-4 h-4" />
              Incoming transactions detected! Live refreshed.
            </span>
            <button 
              onClick={() => setNewOrderAlert(false)}
              className="text-white hover:text-slate-100 bg-white/20 px-2 py-0.5 rounded text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filters Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 text-sm">Customer Orders</span>
            <span className="bg-slate-200 text-slate-800 text-xs px-2 py-0.5 rounded-full font-mono font-bold">
              {filteredOrders.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound toggle */}
            <button 
              onClick={() => onSoundToggle(!soundEnabled)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
              title={soundEnabled ? 'Mute Alerts' : 'Enable Audio Alerts'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-500" />}
            </button>
            
            {/* Selector */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold px-2 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none"
            >
              <option value="all">All States</option>
              <option value="pending">⏳ Pending</option>
              <option value="confirmed">💙 Confirmed</option>
              <option value="completed">✅ Completed</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>
          </div>
        </div>

        {/* Scrollable Order List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold">Retrieving sales list...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-2">
              <ShoppingBag className="w-12 h-12 stroke-1 text-slate-300" />
              <p className="text-xs font-semibold">No orders under this filter.</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isSelected = order.id === selectedOrderId;
              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`p-4 cursor-pointer hover:bg-slate-50/50 transition-all ${
                    isSelected ? 'bg-slate-50 border-l-4 border-emerald-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-xs text-slate-800">
                      {order.id}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {order.createdAt ? formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }) : ''}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs text-slate-500 font-semibold">
                      👤 {order.customerInfo?.name || 'Guest User'}
                    </div>
                    <span className="font-bold text-slate-800 text-sm">
                      {formatNaira(order.total)}
                    </span>
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${statusColors[order.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {order.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${paymentStatusColors[order.paymentStatus] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {order.paymentStatus}
                    </span>
                    {((order.paymentMethod || (order as any).payment_method) === 'Paystack') && (order.paymentStatus === 'paid') && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500 text-white border border-teal-600 ring-1 ring-teal-400/10">
                        Paid via Paystack {order.reference || (order as any).reference ? `(${order.reference || (order as any).reference})` : ''}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-semibold ml-auto font-mono">
                      {order.items?.length || 0} items
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Detail Pane */}
      <div className="w-full lg:w-7/12 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        {currentOrder ? (
          <div className="flex flex-col h-full">
            {/* Header info */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono font-bold text-slate-800 text-lg">
                    {currentOrder.id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${statusColors[currentOrder.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {currentOrder.status}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${paymentStatusColors[currentOrder.paymentStatus] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {currentOrder.paymentStatus}
                  </span>
                  {((currentOrder.paymentMethod || (currentOrder as any).payment_method) === 'Paystack') && (currentOrder.paymentStatus === 'paid') && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500 text-white border border-teal-600 ring-1 ring-teal-400/10">
                      Paid via Paystack {currentOrder.reference || (currentOrder as any).reference ? `(${currentOrder.reference || (currentOrder as any).reference})` : ''}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 font-semibold">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Placed on: {currentOrder.createdAt ? new Date(currentOrder.createdAt).toLocaleString() : 'Unknown date'}</span>
                </div>
              </div>

              <button
                onClick={() => handlePrintInvoice(currentOrder)}
                className="flex items-center justify-center gap-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </button>
            </div>

            {/* Main Detail Body Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Customer Info Card */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1">
                  <User className="w-4 h-4 text-slate-500" />
                  Customer Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-slate-400 font-semibold mb-0.5">Name</p>
                    <p className="text-slate-800 font-bold text-sm">
                      {currentOrder.customerInfo?.name || 'Guest Customer'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold mb-0.5">Phone Number</p>
                    <p className="text-slate-800 font-bold text-sm flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {currentOrder.customerInfo?.phone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold mb-0.5">Email Address</p>
                    <p className="text-slate-800 font-bold text-sm flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {currentOrder.customerInfo?.email || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-semibold mb-0.5">Delivery Address</p>
                    <p className="text-slate-800 font-bold text-sm flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                      <span>{currentOrder.customerInfo?.address || 'N/A'}, Abuja</span>
                    </p>
                  </div>
                </div>
                {currentOrder.notes && (
                  <div className="mt-3 pt-3 border-t border-slate-200/50">
                    <p className="text-slate-400 font-semibold mb-0.5">Order Note/Instruction</p>
                    <p className="text-slate-700 italic">"{currentOrder.notes}"</p>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1">
                  <FileText className="w-4 h-4 text-slate-500" />
                  Order Line Items
                </h4>
                <div className="border border-slate-100 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                      <tr>
                        <th className="py-2.5 px-4">Item Name</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Price</th>
                        <th className="py-2.5 px-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {currentOrder.items?.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-800">{item.name}</td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-600">{item.quantity}</td>
                          <td className="py-3 px-3 text-right font-semibold text-slate-600">{formatNaira(item.price)}</td>
                          <td className="py-3 px-4 text-right font-bold text-slate-800">
                            {formatNaira(item.price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Info & Status Management */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status update column */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Update Order Progress</h5>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleUpdateStatus(currentOrder.id, 'confirmed')}
                      disabled={updatingId === currentOrder.id || currentOrder.status === 'confirmed'}
                      className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg border border-blue-200 disabled:opacity-50"
                    >
                      💙 Confirm Order
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(currentOrder.id, 'completed')}
                      disabled={updatingId === currentOrder.id || currentOrder.status === 'completed'}
                      className="px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg border border-emerald-200 disabled:opacity-50"
                    >
                      ✅ Complete Order
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(currentOrder.id, 'cancelled')}
                      disabled={updatingId === currentOrder.id || currentOrder.status === 'cancelled'}
                      className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg border border-red-200 disabled:opacity-50"
                    >
                      ❌ Cancel Order
                    </button>
                  </div>
                </div>

                {/* Payment status update column */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Manage Payment State</h5>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdatePayment(currentOrder.id, 'paid')}
                      disabled={updatingId === currentOrder.id || currentOrder.paymentStatus === 'paid'}
                      className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50"
                    >
                      💵 Mark as Paid
                    </button>
                    <button
                      onClick={() => handleUpdatePayment(currentOrder.id, 'unpaid')}
                      disabled={updatingId === currentOrder.id || currentOrder.paymentStatus === 'unpaid'}
                      className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 rounded-lg disabled:opacity-50"
                    >
                      🔄 Reset to Unpaid
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Payment Method: {currentOrder.paymentMethod || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Total Bar */}
            <div className="bg-slate-50 border-t border-slate-100 p-6">
              <div className="max-w-xs ml-auto space-y-1.5 text-xs">
                <div className="flex justify-between font-semibold text-slate-500">
                  <span>Subtotal:</span>
                  <span>{formatNaira(currentOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-500">
                  <span>VAT (7.5%):</span>
                  <span>{formatNaira(currentOrder.tax)}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-500">
                  <span>Delivery Cost:</span>
                  <span>{formatNaira(currentOrder.shippingCost)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-600 text-lg border-t border-slate-200 pt-2 mt-2">
                  <span>Grand Total:</span>
                  <span>{formatNaira(currentOrder.total)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="m-auto text-center py-20 text-slate-400 flex flex-col items-center gap-3">
            <ShoppingBag className="w-16 h-16 stroke-1 text-slate-300" />
            <p className="text-sm font-semibold">Select an order from the list to display details.</p>
          </div>
        )}
      </div>
    </div>
  );
}
