import { create } from 'zustand';
import api from '../utils/api';
import toast from 'react-hot-toast';

export const useProfileStore = create((set, get) => ({
  profiles: [],
  currentProfile: null,
  loading: false,
  error: null,

  fetchProfiles: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/profiles');
      set({ profiles: response.data.data.profiles, loading: false });
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to fetch profiles';
      set({ error: errorMsg, loading: false });
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  getProfile: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/profiles/${id}`);
      set({ currentProfile: response.data.data, loading: false });
      return { success: true, data: response.data.data };
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to fetch profile';
      set({ error: errorMsg, loading: false });
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  createProfile: async (profileData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/profiles', profileData);
      const newProfile = response.data.data;
      
      set((state) => ({
        profiles: [...state.profiles, newProfile],
        loading: false,
      }));

      toast.success('Profile created successfully');
      return { success: true, data: newProfile };
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to create profile';
      set({ error: errorMsg, loading: false });
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  updateProfile: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/profiles/${id}`, updates);
      const updatedProfile = response.data.data;

      set((state) => ({
        profiles: state.profiles.map((p) =>
          p._id === id ? updatedProfile : p
        ),
        currentProfile:
          state.currentProfile?._id === id ? updatedProfile : state.currentProfile,
        loading: false,
      }));

      toast.success('Profile updated successfully');
      return { success: true, data: updatedProfile };
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to update profile';
      set({ error: errorMsg, loading: false });
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  deleteProfile: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/profiles/${id}`);

      set((state) => ({
        profiles: state.profiles.filter((p) => p._id !== id),
        loading: false,
      }));

      toast.success('Profile deleted successfully');
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to delete profile';
      set({ error: errorMsg, loading: false });
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  cloneProfile: async (id, name) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post(`/profiles/${id}/clone`, { name });
      const clonedProfile = response.data.data;

      set((state) => ({
        profiles: [...state.profiles, clonedProfile],
        loading: false,
      }));

      toast.success('Profile cloned successfully');
      return { success: true, data: clonedProfile };
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to clone profile';
      set({ error: errorMsg, loading: false });
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  launchProfile: async (profile) => {
    try {
      // Record launch in backend
      await api.post(`/profiles/${profile._id}/launch`);

      // Launch browser via Electron API
      const result = await window.electronAPI.profile.launch(profile);

      if (result.success) {
        toast.success(`Profile "${profile.name}" launched`);
        
        // Update last launched
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p._id === profile._id
              ? { ...p, lastLaunched: new Date().toISOString() }
              : p
          ),
        }));
      } else {
        toast.error(result.error || 'Failed to launch profile');
      }

      return result;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to launch profile';
      toast.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  },

  exportProfile: async (profile) => {
    try {
      const result = await window.electronAPI.profile.export(profile);
      
      if (result.success && !result.cancelled) {
        toast.success('Profile exported successfully');
      }
      
      return result;
    } catch (error) {
      toast.error('Failed to export profile');
      return { success: false, error: error.message };
    }
  },

  importProfile: async () => {
    try {
      const result = await window.electronAPI.profile.import();
      
      if (result.success && !result.cancelled) {
        const { profile } = result;
        
        // Create profile in backend
        const createResult = await get().createProfile(profile);
        
        if (createResult.success) {
          toast.success('Profile imported successfully');
        }
        
        return createResult;
      }
      
      return result;
    } catch (error) {
      toast.error('Failed to import profile');
      return { success: false, error: error.message };
    }
  },
}));
