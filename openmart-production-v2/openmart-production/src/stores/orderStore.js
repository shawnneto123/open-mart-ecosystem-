import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import useAuthStore from './authStore';

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
            .order('created_at', { ascending: false });
          if (error) throw error;
          if (data) {
            // Map snake_case DB columns to camelCase for the app
            const mapped = data.map((o) => ({
              ...o,
              createdAt: o.created_at ?? o.createdAt,
              updatedAt: o.updated_at ?? o.updatedAt,
              paymentStatus: o.payment_status ?? o.paymentStatus,
              shippingCost: o.shipping_cost ?? o.shippingCost,
              paymentMethod: o.payment_method ?? o.paymentMethod,
              customerInfo: o.customer_info ?? o.customerInfo,
            }));
            set({ orders: mapped });
          }
        } catch (err) {
          console.error('Supabase fetch orders error:', err);
        }
      },

      createOrder: async (orderData) => {
        // Get the current authenticated user's ID
        const currentUser = useAuthStore.getState().user;

        const order = {
          id: `ORD_${Date.now()}`,
          user_id: currentUser?.id || null,
          items: orderData.items || [],
          status: 'pending',
          payment_status: orderData.paymentStatus || 'unpaid',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          subtotal: orderData.subtotal || 0,
          tax: orderData.tax || 0,
          shipping_cost: orderData.shippingCost || 0,
          total: orderData.total || 0,
          payment_method: orderData.paymentMethod || null,
          customer_info: orderData.customerInfo || {},
          notes: orderData.notes || '',
          reference: orderData.reference || null,
        };

        // Also keep camelCase aliases in local state for component compatibility
        const orderLocal = {
          ...order,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          paymentStatus: order.payment_status,
          shippingCost: order.shipping_cost,
          paymentMethod: order.payment_method,
          customerInfo: order.customer_info,
        };

        set((state) => ({
          orders: [orderLocal, ...state.orders],
          currentOrder: orderLocal,
        }));

        if (isSupabaseConfigured) {
          try {
            const { error } = await supabase.from('orders').insert([order]);
            if (error) throw error;
          } catch (err) {
            console.error('Supabase insert order error:', err);
          }
        }

        return orderLocal;
      },

      updateOrderStatus: async (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId
              ? { ...order, status, updatedAt: new Date().toISOString() }
              : order
          ),
        }));

        if (isSupabaseConfigured) {
          try {
            await supabase
              .from('orders')
              .update({ status, updated_at: new Date().toISOString() })
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
              ? { ...order, paymentStatus, updatedAt: new Date().toISOString() }
              : order
          ),
        }));

        if (isSupabaseConfigured) {
          try {
            await supabase
              .from('orders')
              .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
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
