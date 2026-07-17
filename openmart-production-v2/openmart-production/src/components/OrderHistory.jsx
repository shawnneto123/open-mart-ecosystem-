import React, { useState, useMemo, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Download, Filter } from 'lucide-react';
import useOrderStore from '../stores/orderStore';
import useAuthStore from '../stores/authStore';

const statusColors = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const paymentStatusColors = {
  unpaid: 'bg-red-50 text-red-700 border-red-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
};

export default function OrderHistory() {
  const { orders, fetchOrders } = useOrderStore();
  const user = useAuthStore((state) => state.user);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const userOrders = useMemo(() => {
    if (!user) return orders;
    if (user.role === 'staff') return orders;

    const normalizedUserEmail = String(user.email || '').trim().toLowerCase();

    // Match by email OR by userId so guest orders placed before login are visible.
    return orders.filter((order) => {
      const orderUserId = order.userId ?? order.user_id ?? null;
      const orderEmail = String(order.customerInfo?.email || '').trim().toLowerCase();

      return orderEmail === normalizedUserEmail || (orderUserId && orderUserId === user.id);
    });
  }, [orders, user]);

  const stats = useMemo(() => {
    return {
      totalOrders: userOrders.length,
      pendingOrders: userOrders.filter((o) => o.status === 'pending').length,
      completedOrders: userOrders.filter((o) => o.status === 'completed').length,
      totalRevenue: userOrders
        .filter((o) => o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + o.total, 0),
    };
  }, [userOrders]);

  const filteredOrders = useMemo(() => {
    return userOrders.filter((order) =>
      statusFilter === 'all' ? true : order.status === statusFilter
    );
  }, [userOrders, statusFilter]);

  const handleExport = () => {
    if (userOrders.length === 0) return;
    const headers = [
      'Order ID',
      'Date',
      'Customer',
      'Total',
      'Status',
      'Payment Status',
      'Items Count',
    ];

    const rows = userOrders.map((order) => [
      order.id,
      new Date(order.createdAt).toLocaleDateString(),
      order.customerInfo?.name || 'N/A',
      `₦${order.total.toFixed(2)}`,
      order.status,
      order.paymentStatus,
      order.items.length,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', `openmart_orders_${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrintInvoice = (order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow popups to print invoices.');
      return;
    }

    const itemsRows = order.items.map((item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₦${(item.price || 0).toLocaleString()}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₦${((item.price || 0) * item.quantity).toLocaleString()}</td>
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
              Date: ${new Date(order.createdAt).toLocaleDateString()}<br />
              Status: ${order.status.toUpperCase()}<br />
              Payment Status: ${order.paymentStatus.toUpperCase()} (${order.paymentMethod || 'N/A'})
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Order History</h1>
            <p className="text-gray-600 mt-2">Manage and track all your orders</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray-600 text-sm mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray-600 text-sm mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray-600 text-sm mb-1">Completed</p>
            <p className="text-3xl font-bold text-green-600">{stats.completedOrders}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600">₦{(stats.totalRevenue || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center gap-2">
          <Filter size={20} className="text-gray-600" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600 text-lg">No orders found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">
                            {order.customerInfo?.name || 'Guest'}
                          </p>
                          <p className="text-gray-600">{order.customerInfo?.phone || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                        <br />
                        <span className="text-xs">
                          {formatDistanceToNow(new Date(order.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ₦{order.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${statusColors[order.status] || 'bg-gray-50 text-gray-700'
                            }`}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${paymentStatusColors[order.paymentStatus] ||
                            'bg-gray-50 text-gray-700'
                            }`}
                        >
                          {order.paymentStatus.charAt(0).toUpperCase() +
                            order.paymentStatus.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm flex gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handlePrintInvoice(order)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                        >
                          Print Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Slide-Up Detail Modal Backdrop */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col p-6 animate-slide-up sm:animate-fade-in border border-gray-100">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-xl">Order Details</h3>
                  <p className="text-xs text-gray-500 mt-1">ID: #{selectedOrder.id}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600 font-bold text-lg p-1"
                >
                  ✕
                </button>
              </div>

              {/* Progress Timeline */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-4 mb-6">
                <h4 className="font-bold text-xs text-green-800 uppercase tracking-wider mb-3">Order Status Lifecycle</h4>
                <div className="relative mt-4 mb-2">
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 rounded-full"></div>
                  {/* Progress fill */}
                  <div 
                    className="absolute top-1/2 left-0 h-1 bg-green-600 -translate-y-1/2 rounded-full transition-all duration-300"
                    style={{ 
                      width: selectedOrder.status === 'completed' 
                        ? '100%' 
                        : selectedOrder.status === 'confirmed' 
                          ? '50%' 
                          : '0%' 
                    }}
                  ></div>
                  <div className="relative flex justify-between">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xxs ring-4 ring-white shadow-sm z-10">
                        ✓
                      </div>
                      <span className="text-xxs font-semibold text-gray-800 mt-1">Pending</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xxs ring-4 ring-white shadow-sm z-10 ${
                        selectedOrder.status === 'confirmed' || selectedOrder.status === 'completed'
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {selectedOrder.status === 'confirmed' || selectedOrder.status === 'completed' ? '✓' : '2'}
                      </div>
                      <span className={`text-xxs font-semibold mt-1 ${
                        selectedOrder.status === 'confirmed' || selectedOrder.status === 'completed' 
                          ? 'text-gray-800' 
                          : 'text-gray-400'
                      }`}>
                        Confirmed
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xxs ring-4 ring-white shadow-sm z-10 ${
                        selectedOrder.status === 'completed' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {selectedOrder.status === 'completed' ? '✓' : '3'}
                      </div>
                      <span className={`text-xxs font-semibold mt-1 ${
                        selectedOrder.status === 'completed' ? 'text-gray-800' : 'text-gray-400'
                      }`}>
                        Delivered
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Sections */}
              <div className="space-y-4 text-sm flex-grow">
                {/* Items List */}
                <div>
                  <h4 className="font-bold text-gray-700 border-b border-gray-100 pb-1 mb-2">Items Summary</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="text-gray-800 font-medium">
                          {item.name} <span className="text-gray-500 font-normal">x{item.quantity}</span>
                        </span>
                        <span className="font-semibold text-gray-900">₦{((item.price || 0) * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>₦{(selectedOrder.subtotal || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>VAT (7.5%):</span>
                    <span>₦{(selectedOrder.tax || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee ({selectedOrder.customerInfo?.city || 'Abuja'}):</span>
                    <span>₦{(selectedOrder.shippingCost || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-900 font-bold border-t border-gray-200 pt-1.5 mt-1.5 text-sm">
                    <span>Total Amount:</span>
                    <span className="text-green-600">₦{(selectedOrder.total || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Customer & Delivery */}
                <div>
                  <h4 className="font-bold text-gray-700 border-b border-gray-100 pb-1 mb-2">Delivery & Contact</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-500 font-medium">Customer Name</p>
                      <p className="font-semibold text-gray-800">{selectedOrder.customerInfo?.name || 'Guest'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Phone Number</p>
                      <p className="font-semibold text-gray-800">{selectedOrder.customerInfo?.phone || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500 font-medium">Delivery Address</p>
                      <p className="font-semibold text-gray-800">
                        {selectedOrder.customerInfo?.address || 'N/A'}, {selectedOrder.customerInfo?.city || 'Abuja'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Payment Method</p>
                      <p className="font-semibold text-gray-800 capitalize">{selectedOrder.paymentMethod || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">Payment Status</p>
                      <p className="font-semibold text-gray-800 capitalize">{selectedOrder.paymentStatus || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-3 border-t border-gray-100 pt-4 mt-6">
                <button
                  onClick={() => handlePrintInvoice(selectedOrder)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-xl text-xs transition shadow-sm text-center"
                >
                  Print Receipt
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2 rounded-xl text-xs transition text-center"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
