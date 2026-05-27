import { create } from 'zustand';
import { settingsApi } from '../api/settings';
import type { StoreSetting } from '../types';

interface SettingsState {
  settings: StoreSetting | null;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<StoreSetting>) => Promise<boolean>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  isLoading: false,
  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const res = await settingsApi.get();
      if (res.success && res.data) {
        set({ settings: res.data });
      }
    } catch (err) {
      console.error('Failed to fetch store settings', err);
    } finally {
      set({ isLoading: false });
    }
  },
  updateSettings: async (data) => {
    set({ isLoading: true });
    try {
      const res = await settingsApi.update(data);
      if (res.success && res.data) {
        set({ settings: res.data });
        return true;
      }
    } catch (err) {
      console.error('Failed to update store settings', err);
    } finally {
      set({ isLoading: false });
    }
    return false;
  },
}));

export const formatCurrency = (amount: number, settings: StoreSetting | null) => {
  const currency = settings?.currency || 'USD';
  const locale = currency === 'IDR' ? 'id-ID' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'IDR' ? 0 : 2,
    maximumFractionDigits: currency === 'IDR' ? 0 : 2,
  }).format(amount);
};
