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
        const currentUser = useAuthStore.getState().user;

        // Preserve the local order history when the customer is not authenticated.
        // This prevents checkout-created orders from being wiped out by a remote
        // fetch that returns no rows during guest/sessionless navigation.
        if (!currentUser) {
          return;
        }

        if (!isSupabaseConfigured) return;
        try {
          if (supabase.auth) {
            await supabase.auth.getSession();
          }
          let result = await supabase
            .from('orders')
            .select('*')
            .order('createdAt', { ascending: false });

          if (result.error) {
            result = await supabase
              .from('orders')
              .select('*')
              .order('created_at', { ascending: false });
          }

          if (result.error) throw result.error;
          if (result.data) {
            // Normalize both camelCase and snake_case DB rows for the UI.
            const mapped = result.data.map((o) => ({
              ...o,
              userId: o.userId ?? o.user_id ?? null,
              user_id: o.user_id ?? o.userId ?? null,
              createdAt: o.createdAt ?? o.created_at ?? o.createdAt,
              updatedAt: o.updatedAt ?? o.updated_at ?? o.updatedAt,
              paymentStatus: o.paymentStatus ?? o.payment_status ?? o.paymentStatus,
              shippingCost: o.shippingCost ?? o.shipping_cost ?? o.shippingCost,
              paymentMethod: o.paymentMethod ?? o.payment_method ?? o.paymentMethod,
              customerInfo: o.customerInfo ?? o.customer_info ?? o.customerInfo,
            }));

            if (mapped.length > 0) {
              set({ orders: mapped });
            }
          }
        } catch (err) {
          console.error('Supabase fetch orders error:', err);
        }
      },

      createOrder: async (orderData) => {
        const currentUser = useAuthStore.getState().user;
        const now = new Date().toISOString();

        const logSupabaseInsertError = (label, error) => {
          console.error(label, {
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            code: error?.code,
            status: error?.status,
            fullError: error,
          });
        };

        // Local state object uses camelCase (for UI display)
        const orderLocal = {
          id: `ORD_${Date.now()}`,
          userId: currentUser?.id || null,
          user_id: currentUser?.id || null,
          items: orderData.items || [],
          status: 'pending',
          paymentStatus: orderData.paymentStatus || 'unpaid',
          createdAt: now,
          updatedAt: now,
          subtotal: orderData.subtotal || 0,
          tax: orderData.tax || 0,
          shippingCost: orderData.shippingCost || 0,
          total: orderData.total || 0,
          paymentMethod: orderData.paymentMethod || null,
          customerInfo: orderData.customerInfo || {},
          notes: orderData.notes || '',
          reference: orderData.reference || null,
        };

        set((state) => ({
          orders: [orderLocal, ...state.orders],
          currentOrder: orderLocal,
        }));

        if (isSupabaseConfigured) {
          try {
            if (supabase.auth) {
              await supabase.auth.getSession();
            }

            const dbRow = {
              ...(orderLocal.id ? { id: orderLocal.id } : {}),
              items: orderLocal.items,
              status: orderLocal.status,
              paymentStatus: orderLocal.paymentStatus,
              subtotal: orderLocal.subtotal,
              tax: orderLocal.tax,
              shippingCost: orderLocal.shippingCost,
              total: orderLocal.total,
              paymentMethod: orderLocal.paymentMethod,
              customerInfo: orderLocal.customerInfo,
              notes: orderLocal.notes,
              reference: orderLocal.reference,
            };

            const { data, error } = await supabase
              .from('orders')
              .insert([dbRow])
              .select();

            if (error) {
              console.error('🔴 Supabase Insert Error Details:', error);
              logSupabaseInsertError('Supabase insert order error payload:', error);
              throw new Error(error.message || 'Database rejected the order insert payload.');
            }

            console.log('Order inserted to Supabase successfully:', orderLocal.id, data);
          } catch (err) {
            logSupabaseInsertError('Supabase insert order error payload:', err);
            throw err;
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
            if (supabase.auth) {
              await supabase.auth.getSession();
            }
            const now = new Date().toISOString();
            const { error } = await supabase
              .from('orders')
              .update({ status, updatedAt: now })
              .eq('id', orderId);

            if (error) {
              console.warn('CamelCase order status update failed, retrying with snake_case fallback:', error);
              const { error: fallbackError } = await supabase
                .from('orders')
                .update({ status, updated_at: now })
                .eq('id', orderId);
              if (fallbackError) throw fallbackError;
            }
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
            if (supabase.auth) {
              await supabase.auth.getSession();
            }
            const now = new Date().toISOString();
            const { error } = await supabase
              .from('orders')
              .update({ paymentStatus, updatedAt: now })
              .eq('id', orderId);

            if (error) {
              console.warn('CamelCase payment status update failed, retrying with snake_case fallback:', error);
              const { error: fallbackError } = await supabase
                .from('orders')
                .update({ payment_status: paymentStatus, updated_at: now })
                .eq('id', orderId);
              if (fallbackError) throw fallbackError;
            }
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
