import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BusinessType } from '@/types';

interface BusinessState {
  activeBusiness: BusinessType | null;
  hasSelectedBusiness: boolean;

  selectBusiness: (business: BusinessType) => void;
  clearBusiness: () => void;
  getActiveBusiness: () => BusinessType | null;
  isKiosko: () => boolean;
  isDelivery: () => boolean;
}

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set, get) => ({
      activeBusiness: null,
      hasSelectedBusiness: false,

      selectBusiness: (business) => {
        set({ activeBusiness: business, hasSelectedBusiness: true });
      },

      clearBusiness: () => {
        set({ activeBusiness: null, hasSelectedBusiness: false });
      },

      getActiveBusiness: () => get().activeBusiness,

      isKiosko: () => get().activeBusiness === 'kiosko',

      isDelivery: () => get().activeBusiness === 'delivery',
    }),
    {
      name: 'dippy-business',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activeBusiness: state.activeBusiness,
        hasSelectedBusiness: state.hasSelectedBusiness,
      }),
    }
  )
);
