import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '@/utils/uuid';
import { BusinessType } from '@/types';

export type CouponType = 'percentage' | 'fixed' | 'buy_x_get_y';

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minPurchase: number;
  maxUses: number;
  usedCount: number;
  applicableBusinesses: BusinessType[];
  productIds?: string[];
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
}

export interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
}

interface CouponState {
  coupons: Coupon[];

  createCoupon: (data: Omit<Coupon, 'id' | 'usedCount' | 'createdAt' | 'isActive'>) => Coupon;
  updateCoupon: (id: string, data: Partial<Coupon>) => void;
  deactivateCoupon: (id: string) => void;
  validateCoupon: (code: string, businessId: BusinessType, cartTotal: number) => Coupon | null;
  applyCoupon: (code: string) => void;
  getCoupons: () => Coupon[];
  getActiveCoupons: () => Coupon[];
  calculateDiscount: (coupon: Coupon, subtotal: number) => number;
}

export const useCouponStore = create<CouponState>()(
  persist(
    (set, get) => ({
      coupons: [],

      createCoupon: (data) => {
        const coupon: Coupon = {
          ...data,
          id: generateId(),
          usedCount: 0,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        set(state => ({ coupons: [...state.coupons, coupon] }));
        return coupon;
      },

      updateCoupon: (id, data) => {
        set(state => ({
          coupons: state.coupons.map(c => c.id === id ? { ...c, ...data } : c),
        }));
      },

      deactivateCoupon: (id) => {
        set(state => ({
          coupons: state.coupons.map(c => c.id === id ? { ...c, isActive: false } : c),
        }));
      },

      validateCoupon: (code, businessId, cartTotal) => {
        const coupon = get().coupons.find(
          c => c.code.toUpperCase() === code.toUpperCase() && c.isActive
        );
        if (!coupon) return null;

        const now = new Date();
        if (now < new Date(coupon.validFrom) || now > new Date(coupon.validUntil)) return null;
        if (coupon.usedCount >= coupon.maxUses) return null;
        if (cartTotal < coupon.minPurchase) return null;
        if (!coupon.applicableBusinesses.includes(businessId)) return null;

        return coupon;
      },

      applyCoupon: (code) => {
        set(state => ({
          coupons: state.coupons.map(c =>
            c.code.toUpperCase() === code.toUpperCase()
              ? { ...c, usedCount: c.usedCount + 1 }
              : c
          ),
        }));
      },

      getCoupons: () => get().coupons,

      getActiveCoupons: () => {
        const now = new Date();
        return get().coupons.filter(c =>
          c.isActive && now >= new Date(c.validFrom) && now <= new Date(c.validUntil)
        );
      },

      calculateDiscount: (coupon, subtotal) => {
        switch (coupon.type) {
          case 'percentage':
            return Math.min(subtotal * (coupon.value / 100), subtotal);
          case 'fixed':
            return Math.min(coupon.value, subtotal);
          case 'buy_x_get_y':
            return 0;
          default:
            return 0;
        }
      },
    }),
    {
      name: 'dippy-coupons',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
