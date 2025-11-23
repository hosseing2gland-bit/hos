import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, accessToken } = response.data.data;

          set({
            user,
            token: accessToken,
            isAuthenticated: true,
          });

          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.error || 'Login failed',
          };
        }
      },

      register: async (username, email, password) => {
        try {
          const response = await api.post('/auth/register', {
            username,
            email,
            password,
          });
          const { user, accessToken } = response.data.data;

          set({
            user,
            token: accessToken,
            isAuthenticated: true,
          });

          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.error || 'Registration failed',
          };
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      refreshToken: async () => {
        try {
          const response = await api.post('/auth/refresh');
          const { accessToken } = response.data.data;

          set({ token: accessToken });

          return { success: true };
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          return { success: false };
        }
      },

      updateProfile: async (updates) => {
        try {
          const response = await api.put('/auth/me', updates);
          const user = response.data.data;

          set({ user });

          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.error || 'Update failed',
          };
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
