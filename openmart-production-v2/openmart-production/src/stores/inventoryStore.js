import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getCategory, generateNairaPrice } from '../utils/categoryHelper';
import { getProductImageUrl } from '../utils/imageHelper';
import {
  isSupabaseConfigured,
  fetchProducts,
  addProduct,
  updateProductQuantity,
  deleteProduct,
  setBulkProducts,
  supabase
} from '../services/supabase';

const useInventoryStore = create(
  persist(
    (set, get) => ({
      // State
      items: [],
      isLoading: false,
      error: null,
      lastUpdated: null,

      // Actions
      fetchInventory: async () => {
        if (!isSupabaseConfigured) return;
        set({ isLoading: true });
        try {
          const data = await fetchProducts();
          set({ items: data, lastUpdated: new Date().toISOString() });
        } catch (err) {
          set({ error: err.message });
        } finally {
          set({ isLoading: false });
        }
      },

      setInventory: async (items) => {
        try {
          const enrichedItems = items.map((item, idx) => {
            const name = item.name || '';
            const category = item.category || getCategory(name);
            const price = typeof item.price === 'number' ? item.price : generateNairaPrice(name);
            const image = item.image || getProductImageUrl(name);
            return {
              name,
              category,
              price,
              image,
              quantity: item.quantity || 0,
            };
          });

          if (isSupabaseConfigured) {
            const data = await setBulkProducts(enrichedItems);
            set({
              items: data,
              lastUpdated: new Date().toISOString(),
              error: null,
            });
          } else {
            const localItems = enrichedItems.map((item, idx) => {
              const qty = item.quantity || 0;
              return {
                id: item.id || `inv_${Date.now()}_${idx}`,
                ...item,
                dateAdded: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                isLowStock: qty < 10,
              };
            });
            set({
              items: localItems,
              lastUpdated: new Date().toISOString(),
              error: null,
            });
          }
        } catch (err) {
          set({ error: err.message });
        }
      },

      updateQuantity: async (itemId, newQuantity) => {
        const qty = Math.max(0, newQuantity);
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity: qty,
                  isLowStock: qty < 10,
                  lastUpdated: new Date().toISOString(),
                }
              : item
          ),
          lastUpdated: new Date().toISOString(),
        }));

        if (isSupabaseConfigured) {
          try {
            await updateProductQuantity(itemId, qty);
          } catch (err) {
            console.error('Supabase update error:', err);
          }
        }
      },

      deleteItem: async (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
          lastUpdated: new Date().toISOString(),
        }));

        if (isSupabaseConfigured) {
          try {
            await deleteProduct(itemId);
          } catch (err) {
            console.error('Supabase delete error:', err);
          }
        }
      },

      addItem: async (item) => {
        const name = item.name || '';
        const category = item.category || getCategory(name);
        const price = typeof item.price === 'number' ? item.price : generateNairaPrice(name);
        const image = item.image || getProductImageUrl(name);
        
        const rawProduct = {
          name,
          category,
          price,
          image,
          quantity: item.quantity || 0,
        };

        if (isSupabaseConfigured) {
          try {
            const newProduct = await addProduct(rawProduct);
            if (newProduct) {
              set((state) => ({
                items: [...state.items, newProduct],
                lastUpdated: new Date().toISOString(),
              }));
            }
          } catch (err) {
            console.error('Supabase insert error:', err);
          }
        } else {
          const newItem = {
            id: item.id || `inv_${Date.now()}`,
            ...rawProduct,
            dateAdded: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            isLowStock: rawProduct.quantity < 10,
          };
          set((state) => ({
            items: [...state.items, newItem],
            lastUpdated: new Date().toISOString(),
          }));
        }
      },

      clearInventory: async () => {
        set({ items: [], lastUpdated: new Date().toISOString() });
        if (isSupabaseConfigured && supabase) {
          try {
            await supabase.from('products').delete().neq('id', '');
          } catch (err) {
            console.error('Supabase clear error:', err);
          }
        }
      },

      // Getters
      getItem: (itemId) => {
        return get().items.find((item) => item.id === itemId);
      },

      searchItems: (query) => {
        const normalizedQuery = query.toLowerCase();
        return get().items.filter(
          (item) =>
            item.name.toLowerCase().includes(normalizedQuery) ||
            item.category?.toLowerCase().includes(normalizedQuery)
        );
      },

      getGroupedByCategory: () => {
        const items = get().items;
        return items.reduce((acc, item) => {
          const category = item.category || 'Other';
          if (!acc[category]) acc[category] = [];
          acc[category].push(item);
          return acc;
        }, {});
      },

      getLowStockItems: () => {
        return get().items.filter((item) => item.quantity < 10);
      },

      getStats: () => {
        const items = get().items;
        return {
          totalItems: items.length,
          totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
          categories: new Set(items.map((item) => item.category)).size,
          lowStockCount: items.filter((item) => item.quantity < 10).length,
          totalValue: items.reduce(
            (sum, item) => sum + (item.price || 0) * item.quantity,
            0
          ),
        };
      },

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'openmart_inventory',
      version: 1,
    }
  )
);

export { useInventoryStore };
export default useInventoryStore;
