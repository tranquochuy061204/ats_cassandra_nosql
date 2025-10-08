import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAdminAuth = create(
  persist(
    (set) => ({
      admin: null,
      setUser: (admin) => set({ admin }),
      logout: () => set({ admin: null }),
    }),
    {
      name: 'auth-admin-storage', // tên key trong localStorage
      getStorage: () => localStorage,
    }
  )
);
