import { create } from 'zustand';
import axiosClient from '../api/axiosClient.js';

const useAuthStore = create((set, get) => {
  let rawUser = localStorage.getItem('user');
  let parsedUser = null;
  try {
    if (rawUser && rawUser !== 'undefined') {
      parsedUser = JSON.parse(rawUser);
    }
  } catch (e) {
    console.error("Lỗi khi parse user từ localStorage:", e);
    parsedUser = null;
  }

  const token = localStorage.getItem('token');
  const isAuthenticated = !!token && token !== 'undefined';

  return {
    user: parsedUser,
    token: isAuthenticated ? token : null,
    isAuthenticated,
    isLoading: false,
    error: null,

    // Kiểm tra xác thực từ localStorage và gọi lại thông tin user nếu cần
    checkAuth: async () => {
      const token = localStorage.getItem('token');
      if (!token || token === 'undefined') {
        set({ isAuthenticated: false, user: null, token: null });
        return;
      }
      try {
        const user = await get().getUserInfo();
        set({ isAuthenticated: true, user });
      } catch (err) {
        get().logout();
        console.error("Lỗi khi lấy thông tin người dùng:", err);
      }
    },

    login: async (email, password) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axiosClient.post('/login', { email, password });
        const { token, user } = response;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return response;
      } catch (err) {
        console.error('Login error:', err);  // Kiểm tra lỗi chi tiết
        const errorMessage = err?.response?.data?.message || 'Đăng nhập thất bại';
        set({ isLoading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    },
    

    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      });
    },

    getUserInfo: async () => {
      try {
        const response = await axiosClient.get('/user-info');
        const user = response.data || response.user || response;
        localStorage.setItem('user', JSON.stringify(user));
        set({ user });
        return user;
      } catch (err) {
        throw new Error('Không thể lấy thông tin người dùng');
      }
    },

    forgotPassword: async (email) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axiosClient.post('/forgot-password', { email });
        set({ isLoading: false });
        return response;
      } catch (err) {
        const errorMessage = err?.response?.data?.message || 'Không thể gửi email khôi phục';
        set({ isLoading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    },

    resetPassword: async (token, password) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axiosClient.post('/reset-password', { token, password });
        set({ isLoading: false });
        return response;
      } catch (err) {
        const errorMessage = err?.response?.data?.message || 'Không thể đặt lại mật khẩu';
        set({ isLoading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    },

    updateProfile: async (userData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axiosClient.post('/update-profile', userData);
        if (response.status === 200 || response.success) {
          await get().getUserInfo();
          set({ isLoading: false });
          return response;
        } else {
          throw new Error('Cập nhật thất bại');
        }
      } catch (err) {
        const errorMessage = err?.response?.data?.message || 'Cập nhật thất bại';
        set({ isLoading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    },
  };
});

export default useAuthStore;
