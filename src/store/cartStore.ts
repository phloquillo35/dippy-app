import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, SalesChannel, Product, ProductVariant, PaymentMethod } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOrderStore } from './orderStore';

interface CartState {
  items: CartItem[];
  channel: SalesChannel;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes: string;
  discount: number;
  deliveryFee: number;
  
  // Actions
  addItem: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setChannel: (channel: SalesChannel) => void;
  setCustomerInfo: (info: Partial<{ name: string; phone: string; address: string }>) => void;
  setNotes: (notes: string) => void;
  setDiscount: (discount: number) => void;
  setDeliveryFee: (fee: number) => void;
  
  // Computed
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  getItemsByChannel: () => CartItem[];

  // Delivery: confirmar pedido
  confirmDeliveryOrder: (userName: string, source?: 'menu' | 'whatsapp' | 'phone' | 'presencial') => string | null;
}

const generateItemId = (productId: string, variantId?: string) => 
  `${productId}-${variantId || 'default'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      channel: 'store',
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      notes: '',
      discount: 0,
      deliveryFee: 0,

      addItem: (product, variant, quantity = 1) => {
        const variantId = variant?.id;
        const itemId = generateItemId(product.id, variantId);
        
        const existingIndex = get().items.findIndex(
          item => item.productId === product.id && item.variantId === variantId
        );

        const unitPrice = variant?.price ?? product.salePrice;
        const costPrice = variant?.costPrice ?? product.costPrice;
        const variantName = variant?.name ?? (product.isWeightBased ? 'Unidad' : undefined);

        if (existingIndex >= 0) {
          const newItems = [...get().items];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + quantity,
            totalPrice: (newItems[existingIndex].quantity + quantity) * unitPrice,
          };
          set({ items: newItems });
        } else {
          const newItem: CartItem = {
            id: itemId,
            productId: product.id,
            productName: product.name,
            productImage: product.imageUrl,
            variantId,
            variantName,
            quantity,
            unitPrice,
            costPrice,
            totalPrice: unitPrice * quantity,
            emoji: product.emoji,
          };
          set({ items: [...get().items, newItem] });
        }
      },

      removeItem: (itemId) => {
        set({ items: get().items.filter(item => item.id !== itemId) });
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        const newItems = get().items.map(item => 
          item.id === itemId 
            ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
            : item
        );
        set({ items: newItems });
      },

      clearCart: () => {
        set({ 
          items: [], 
          customerName: '', 
          customerPhone: '',
          customerAddress: '',
          notes: '',
          discount: 0,
          deliveryFee: 0,
        });
      },

      setChannel: (channel) => set({ channel }),

      setCustomerInfo: (info) => set(state => ({ ...state, ...info })),

      setNotes: (notes) => set({ notes }),

      setDiscount: (discount) => set({ discount: Math.max(0, Math.min(100, discount)) }),

      setDeliveryFee: (fee) => set({ deliveryFee: Math.max(0, fee) }),

      getSubtotal: () => get().items.reduce((sum, item) => sum + item.totalPrice, 0),

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().discount;
        const deliveryFee = get().deliveryFee;
        return subtotal * (1 - discount / 100) + deliveryFee;
      },

      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      getItemsByChannel: () => get().items,

      confirmDeliveryOrder: (userName, source = 'menu') => {
        const state = get();
        if (state.items.length === 0) return null;

        const orderStore = useOrderStore.getState();
        const order = orderStore.createOrder({
          customerName: state.customerName || 'Cliente',
          customerPhone: state.customerPhone,
          customerAddress: state.customerAddress,
          items: [...state.items],
          source,
          userName,
          notes: state.notes,
          discount: state.discount,
          deliveryFee: state.deliveryFee,
        });

        get().clearCart();
        return order.id;
      },
    }),
    {
      name: 'dippy-cart',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        channel: state.channel,
        customerName: state.customerName,
        customerPhone: state.customerPhone,
        customerAddress: state.customerAddress,
        notes: state.notes,
        discount: state.discount,
        deliveryFee: state.deliveryFee,
      }),
    }
  )
);

export const useChannelCart = (channel: SalesChannel) => {
  const cart = useCartStore();
  const channelItems = cart.items;
  
  return {
    ...cart,
    items: channelItems,
    getSubtotal: () => channelItems.reduce((sum, item) => sum + item.totalPrice, 0),
    getTotal: () => {
      const subtotal = channelItems.reduce((sum, item) => sum + item.totalPrice, 0);
      return subtotal * (1 - cart.discount / 100) + cart.deliveryFee;
    },
    getItemCount: () => channelItems.reduce((sum, item) => sum + item.quantity, 0),
  };
};