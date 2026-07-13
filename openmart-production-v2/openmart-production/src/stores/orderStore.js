import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

const useOrderStore = create(
  persist(
    (set, get) => ({
      // State
      orders: [],
      currentOrder: null,

      // Actions
      fetchOrders: async () => {
        if (!isSupabaseConfigured) return;
        try {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('createdAt', { ascending: false });
          if (error) throw error;
          if (data) {
            set({ orders: data });
          }
        } catch (err) {
          console.error('Supabase fetch orders error:', err);
        }
      },

      createOrder: async (orderData) => {
        const order = {
          id: `ORD_${Date.now()}`,
          items: orderData.items || [],
          status: 'pending', // pending, confirmed, completed, cancelled
          paymentStatus: 'unpaid', // unpaid, paid, failed
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          subtotal: orderData.subtotal || 0,
          tax: orderData.tax || 0,
          shippingCost: orderData.shippingCost || 0,
          total: orderData.total || 0,
          paymentMethod: orderData.paymentMethod || null,
          customerInfo: orderData.customerInfo || {},
          notes: orderData.notes || '',
        };

        set((state) => ({
          orders: [order, ...state.orders],
          currentOrder: order,
        }));

        if (isSupabaseConfigured) {
          try {
            const { error } = await supabase.from('orders').insert([order]);
            if (error) throw error;
          } catch (err) {
            console.error('Supabase insert order error:', err);
          }
        }

        return order;
      },

      updateOrderStatus: async (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status,
                  updatedAt: new Date().toISOString(),
                }
              : order
          ),
        }));

        if (isSupabaseConfigured) {
          try {
            await supabase
              .from('orders')
              .update({ status, updatedAt: new Date().toISOString() })
              .eq('id', orderId);
          } catch (err) {
            console.error('Supabase update order status error:', err);
          }
        }
      },

      updatePaymentStatus: async (orderId, paymentStatus) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  paymentStatus,
                  updatedAt: new Date().toISOString(),
                }
              : order
          ),
        }));

        if (isSupabaseConfigured) {
          try {
            await supabase
              .from('orders')
              .update({ paymentStatus, updatedAt: new Date().toISOString() })
              .eq('id', orderId);
          } catch (err) {
            console.error('Supabase update payment status error:', err);
          }
        }
      },

      cancelOrder: async (orderId) => {
        await get().updateOrderStatus(orderId, 'cancelled');
      },

      completeOrder: async (orderId) => {
        await get().updateOrderStatus(orderId, 'completed');
      },

      setCurrentOrder: (order) => {
        set({ currentOrder: order });
      },

      clearCurrentOrder: () => {
        set({ currentOrder: null });
      },

      // Getters
      getOrder: (orderId) => {
        return get().orders.find((order) => order.id === orderId);
      },

      getAllOrders: () => {
        return get().orders;
      },

      getOrdersByStatus: (status) => {
        return get().orders.filter((order) => order.status === status);
      },

      getOrdersByPaymentStatus: (paymentStatus) => {
        return get().orders.filter((order) => order.paymentStatus === paymentStatus);
      },

      getRecentOrders: (limit = 10) => {
        return get().orders.slice(0, limit);
      },

      getPendingOrders: () => {
        return get().orders.filter((order) => order.status === 'pending');
      },

      getOrderStats: () => {
        const orders = get().orders;
        return {
          totalOrders: orders.length,
          pendingOrders: orders.filter((o) => o.status === 'pending').length,
          completedOrders: orders.filter((o) => o.status === 'completed').length,
          cancelledOrders: orders.filter((o) => o.status === 'cancelled').length,
          totalRevenue: orders
            .filter((o) => o.paymentStatus === 'paid')
            .reduce((sum, o) => sum + o.total, 0),
          unpaidOrders: orders.filter((o) => o.paymentStatus === 'unpaid').length,
        };
      },

      deleteOrder: (orderId) => {
        set((state) => ({
          orders: state.orders.filter((order) => order.id !== orderId),
        }));
      },

      clearOrders: () => {
        set({ orders: [], currentOrder: null });
      },

      clearOrderHistory: () => {
        set({ orders: [], currentOrder: null });
      },

      // Export orders as JSON
      exportOrders: () => {
        return JSON.stringify(get().orders, null, 2);
      },

      // Export orders as CSV
      exportOrdersAsCSV: () => {
        const orders = get().orders;
        if (orders.length === 0) return 'No orders to export';

        const headers = [
          'Order ID',
          'Date',
          'Customer',
          'Total',
          'Status',
          'Payment Status',
          'Items Count',
        ];

        const rows = orders.map((order) => [
          order.id,
          new Date(order.createdAt).toLocaleDateString(),
          order.customerInfo?.name || 'N/A',
          `₦${order.total.toFixed(2)}`,
          order.status,
          order.paymentStatus,
          order.items.length,
        ]);

        const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
        return csv;
      },
    }),
    {
      name: 'openmart_orders',
      version: 1,
    }
  )
);

export { useOrderStore };
export default useOrderStore;
