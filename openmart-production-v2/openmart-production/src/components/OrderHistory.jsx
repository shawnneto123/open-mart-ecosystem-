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

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const userOrders = useMemo(() => {
    if (!user) return [];
    if (user.role === 'staff') return orders;
    // Match by email OR by userId so guest orders placed before login are visible
    return orders.filter((order) => {
      const orderUserId = order.userId ?? order.user_id ?? null;
      const orderEmail = order.customerInfo?.email || '';
      return orderEmail === user.email || (orderUserId && orderUserId === user.id);
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
                      <td className="px-6 py-4 text-sm">
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

        {/* Order Details - Expandable */}
        <div className="mt-8 space-y-4">
          {filteredOrders.slice(0, 3).map((order) => (
            <details
              key={order.id}
              className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition"
            >
              <summary className="font-semibold text-gray-900">
                Order {order.id} - {order.customerInfo?.name} - ₦{order.total.toFixed(2)}
              </summary>
              <div className="mt-4 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">Items</p>
                    <p className="font-semibold text-gray-900">{order.items.length} items</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Payment Method</p>
                    <p className="font-semibold text-gray-900 capitalize">
                      {order.paymentMethod || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Delivery Address</p>
                    <p className="font-semibold text-gray-900">
                      {order.customerInfo?.address || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Contact</p>
                    <p className="font-semibold text-gray-900">
                      {order.customerInfo?.phone || 'N/A'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 mb-2">Items:</p>
                  <ul className="space-y-1">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="text-gray-700">
                        • {item.name} x{item.quantity} - ₦{(item.price * item.quantity).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
