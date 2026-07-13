import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      // State
      items: [], // { itemId, name, category, quantity, price, image }
      createdAt: null,
      updatedAt: null,

      // Actions
      addToCart: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.itemId === product.id);

          let updatedItems;
          if (existingItem) {
            updatedItems = state.items.map((item) =>
              item.itemId === product.id
                ? {
                    ...item,
                    quantity: item.quantity + quantity,
                  }
                : item
            );
          } else {
            updatedItems = [
              ...state.items,
              {
                itemId: product.id,
                name: product.name,
                category: product.category,
                quantity,
                price: product.price || 0,
                image: product.image,
              },
            ];
          }

          return {
            items: updatedItems,
            updatedAt: new Date().toISOString(),
          };
        });
      },

      removeFromCart: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.itemId !== itemId),
          updatedAt: new Date().toISOString(),
        }));
      },

      updateQuantity: (itemId, newQuantity) => {
        if (newQuantity <= 0) {
          get().removeFromCart(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.itemId === itemId ? { ...item, quantity: newQuantity } : item
          ),
          updatedAt: new Date().toISOString(),
        }));
      },

      clearCart: () => {
        set({
          items: [],
          updatedAt: new Date().toISOString(),
        });
      },

      // Getters
      getCartItem: (itemId) => {
        return get().items.find((item) => item.itemId === itemId);
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getItemCount: () => {
        return get().items.length;
      },

      isEmpty: () => {
        return get().items.length === 0;
      },

      getCartSummary: () => {
        const items = get().items;
        return {
          itemCount: items.length,
          totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
          totalPrice: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
          items,
        };
      },
    }),
    {
      name: 'openmart_cart',
      version: 1,
    }
  )
);

export { useCartStore };
export default useCartStore;
