import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Order, OrderStatus, CartItem, PaymentMethod, BusinessType } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/utils/uuid';
import { useProductStore } from './productStore';

interface DeliveryOrder extends Order {
  amountPaid?: number;
  paymentReceived?: boolean;
  deliveryFee?: number;
  soldAt?: string;
}

interface OrderState {
  orders: DeliveryOrder[];
  currentOrder: DeliveryOrder | null;

  createOrder: (
    businessId: BusinessType,
    items: CartItem[],
    customerName: string,
    customerPhone: string,
    customerAddress: string,
    notes: string,
    userName: string,
    source: 'menu' | 'whatsapp' | 'phone',
    deliveryFee?: number
  ) => DeliveryOrder | null;

  createStoreOrder: (
    businessId: BusinessType,
    items: CartItem[],
    notes: string,
    userName: string,
    paymentMethod: PaymentMethod,
    total: number
  ) => DeliveryOrder | null;

  importFromWhatsApp: (
    message: string,
    userName: string,
    businessId?: BusinessType
  ) => DeliveryOrder | null;

  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  markAsPaid: (orderId: string, method: PaymentMethod, amount: number) => void;
  markAsDelivered: (orderId: string) => void;
  markAsSold: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;

  getPendingOrders: (businessId?: BusinessType) => DeliveryOrder[];
  getActiveOrders: (businessId?: BusinessType) => DeliveryOrder[];
  getSoldOrders: (businessId?: BusinessType) => DeliveryOrder[];
  getAllOrders: (businessId?: BusinessType) => DeliveryOrder[];
  getOrderById: (orderId: string) => DeliveryOrder | undefined;

  reorderFromCustomer: (orderId: string) => CartItem[];
  clearCurrentOrder: () => void;
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      currentOrder: null,

      createOrder: (
        businessId,
        items,
        customerName,
        customerPhone,
        customerAddress,
        notes,
        userName,
        source,
        deliveryFee = 500
      ) => {
        const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
        const total = subtotal + deliveryFee;

        const order: DeliveryOrder = {
          id: generateId(),
          businessId,
          channel: 'delivery',
          items,
          subtotal,
          discount: 0,
          tax: 0,
          total,
          paymentMethod: 'efectivo',
          status: 'pending',
          userId: '',
          userName,
          customerName,
          customerPhone,
          customerAddress,
          notes,
          turnId: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deliveryFee,
          source,
          paymentReceived: false,
        };

        items.forEach(item => {
          useProductStore.getState().updateStock(
            item.productId,
            item.quantity,
            'out',
            `Pedido #${order.id.slice(-6).toUpperCase()}`,
            '',
            userName,
            order.id
          );
        });

        set(state => ({
          orders: [order, ...state.orders],
          currentOrder: order,
        }));

        return order;
      },

      createStoreOrder: (businessId, items, notes, userName, paymentMethod, total) => {
        const order: DeliveryOrder = {
          id: generateId(),
          businessId,
          channel: 'store',
          items,
          subtotal: total,
          discount: 0,
          tax: 0,
          total,
          paymentMethod,
          status: 'sold' as OrderStatus,
          userId: '',
          userName,
          customerName: '',
          customerPhone: '',
          customerAddress: '',
          notes,
          turnId: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          soldAt: new Date().toISOString(),
          source: 'menu',
          paymentReceived: true,
        };

        set(state => ({
          orders: [order, ...state.orders],
        }));

        return order;
      },

      importFromWhatsApp: (message, userName, businessId = 'delivery') => {
        const lines = message.split('\n').filter(l => l.trim());
        const items: CartItem[] = [];
        const products = useProductStore.getState().getProducts(businessId);

        for (const line of lines) {
          const cleaned = line.trim().replace(/^[•\-*]\s*/, '');
          const qtyMatch = cleaned.match(/^(\d+|x\d+)\s+(.+)/i);
          if (!qtyMatch) continue;

          const qty = parseInt(qtyMatch[1].replace('x', '')) || 1;
          const productName = qtyMatch[2].toLowerCase();

          const product = products.find(p =>
            p.name.toLowerCase().includes(productName) ||
            p.tags.some(t => t.toLowerCase().includes(productName))
          );

          if (product) {
            items.push({
              id: generateId(),
              productId: product.id,
              productName: product.name,
              quantity: qty,
              unitPrice: product.salePrice,
              costPrice: product.costPrice,
              totalPrice: product.salePrice * qty,
              emoji: product.emoji,
            });
          }
        }

        if (items.length === 0) return null;

        return get().createOrder(
          businessId,
          items,
          'Cliente WhatsApp',
          '',
          '',
          'Importado desde WhatsApp',
          userName,
          'whatsapp'
        );
      },

      updateOrderStatus: (orderId, status) => {
        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId
              ? { ...o, status, updatedAt: new Date().toISOString() }
              : o
          ),
        }));
      },

      markAsPaid: (orderId, method, amount) => {
        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId
              ? {
                  ...o,
                  paymentMethod: method,
                  amountPaid: amount,
                  paymentReceived: true,
                  updatedAt: new Date().toISOString(),
                }
              : o
          ),
        }));
      },

      markAsDelivered: (orderId) => {
        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId
              ? {
                  ...o,
                  status: 'delivered' as OrderStatus,
                  completedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : o
          ),
        }));
      },

      markAsSold: (orderId) => {
        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId
              ? {
                  ...o,
                  status: 'sold' as OrderStatus,
                  soldAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : o
          ),
        }));
      },

      cancelOrder: (orderId) => {
        const order = get().orders.find(o => o.id === orderId);
        if (order) {
          order.items.forEach(item => {
            useProductStore.getState().updateStock(
              item.productId,
              item.quantity,
              'return',
              `Pedido #${orderId.slice(-6).toUpperCase()} cancelado`,
              '',
              order.userName,
              orderId
            );
          });
        }

        set(state => ({
          orders: state.orders.map(o =>
            o.id === orderId
              ? { ...o, status: 'cancelled' as OrderStatus, updatedAt: new Date().toISOString() }
              : o
          ),
        }));
      },

      getPendingOrders: (businessId) => {
        let orders = get().orders.filter(o => o.status === 'pending');
        if (businessId) orders = orders.filter(o => o.businessId === businessId);
        return orders;
      },

      getActiveOrders: (businessId) => {
        const activeStatuses: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered'];
        let orders = get().orders.filter(o => activeStatuses.includes(o.status));
        if (businessId) orders = orders.filter(o => o.businessId === businessId);
        return orders;
      },

      getSoldOrders: (businessId) => {
        let orders = get().orders.filter(o => o.status === 'sold');
        if (businessId) orders = orders.filter(o => o.businessId === businessId);
        return orders;
      },

      getAllOrders: (businessId) => {
        let orders = get().orders;
        if (businessId) orders = orders.filter(o => o.businessId === businessId);
        return orders;
      },

      getOrderById: (orderId) => get().orders.find(o => o.id === orderId),

      reorderFromCustomer: (orderId) => {
        const order = get().orders.find(o => o.id === orderId);
        return order ? order.items.map(i => ({ ...i, id: generateId() })) : [];
      },

      clearCurrentOrder: () => set({ currentOrder: null }),
    }),
    {
      name: 'dippy-orders',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        orders: state.orders.slice(0, 500),
      }),
    }
  )
);
