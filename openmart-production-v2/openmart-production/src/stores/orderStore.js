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
          // Prefer camelCase ordering to match the admin DB schema; fallback to snake_case
          let res = await supabase.from('orders').select('*').order('createdAt', { ascending: false });
          if (res.error) {
            res = await supabase.from('orders').select('*').order('created_at', { ascending: false });
          }
          const { data, error } = res;
          if (error) throw error;
          if (data) {
            // Map DB columns to camelCase for the app
            const mapped = data.map((o) => ({
              ...o,
              createdAt: o.createdAt ?? o.created_at,
              updatedAt: o.updatedAt ?? o.updated_at,
              paymentStatus: o.paymentStatus ?? o.payment_status,
              shippingCost: o.shippingCost ?? o.shipping_cost,
              paymentMethod: o.paymentMethod ?? o.payment_method,
              customerInfo: o.customerInfo ?? o.customer_info,
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

        // Build the order object using camelCase keys to match the admin DB schema
        const order = {
          id: `ORD_${Date.now()}`,
          user_id: currentUser?.id || null,
          items: orderData.items || [],
          status: 'pending',
          paymentStatus: orderData.paymentStatus || 'unpaid',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          subtotal: orderData.subtotal || 0,
          tax: orderData.tax || 0,
          shippingCost: orderData.shippingCost || 0,
          total: orderData.total || 0,
          paymentMethod: orderData.paymentMethod || null,
          customerInfo: orderData.customerInfo || {},
          notes: orderData.notes || '',
          reference: orderData.reference || null,
        };

        // Local state mirrors the DB shape (camelCase)
        const orderLocal = { ...order };

        set((state) => ({
          orders: [orderLocal, ...state.orders],
          currentOrder: orderLocal,
        }));

        if (isSupabaseConfigured) {
          try {
            // Try inserting with camelCase columns; if that fails, try snake_case fallback
            let insertRes = await supabase.from('orders').insert([order]);
            if (insertRes.error) {
              console.warn('CamelCase insert failed, trying snake_case fallback:', insertRes.error.message || insertRes.error);
              const snake = {
                ...order,
                payment_status: order.paymentStatus,
                created_at: order.createdAt,
                updated_at: order.updatedAt,
                shipping_cost: order.shippingCost,
                payment_method: order.paymentMethod,
                customer_info: order.customerInfo,
              };
              insertRes = await supabase.from('orders').insert([snake]);
            }
            if (insertRes.error) throw insertRes.error;
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
