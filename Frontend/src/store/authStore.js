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

    // Đăng ký tài khoản mới
    register: async (userData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axiosClient.post('/register', userData);
        
        // Kiểm tra status trong response data
        if (response.status && response.status !== 200 && response.status !== 201) {
          throw new Error(response.message || 'Đăng ký thất bại');
        }
        
        set({ isLoading: false });
        return response;
      } catch (err) {
        console.error('Register error:', err);
        const errorMessage = err?.response?.data?.message || err.message || 'Đăng ký thất bại';
        set({ isLoading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    },

    // Đăng nhập
    login: async (email, password) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axiosClient.post('/login', { email, password });
        
        // Kiểm tra status trong response data
        if (response.status && response.status !== 200) {
          throw new Error(response.message || 'Đăng nhập thất bại');
        }
        
        const { token, user } = response;
        
        // Kiểm tra có token và user không
        if (!token || !user) {
          throw new Error('Đăng nhập thất bại');
        }
        
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
        console.error('Login error:', err);
        const errorMessage = err?.response?.data?.message || err.message || 'Đăng nhập thất bại';
        set({ isLoading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    },

    // Đăng xuất
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

    // Lấy thông tin user
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

    // === CÁC HÀM RESET PASSWORD VỚI OTP ===

    // Quên mật khẩu - Gửi OTP qua email
    forgotPassword: async (email) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axiosClient.post('/forgot-password', { email });
        
        // Kiểm tra status trong response data
        if (response.status && response.status !== 200) {
          throw new Error(response.message || 'Không thể gửi email khôi phục');
        }
        
        set({ isLoading: false });
        return response;
      } catch (err) {
        const errorMessage = err?.response?.data?.message || err.message || 'Không thể gửi email khôi phục';
        set({ isLoading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    },

    // Xác thực OTP
    verifyOTP: async (otp) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axiosClient.post('/verify-otp', { otp });
        
        // Kiểm tra status trong response data
        if (response.status && response.status !== 200) {
          throw new Error(response.message || 'OTP không hợp lệ');
        }
        
        set({ isLoading: false });
        return response;
      } catch (err) {
        const errorMessage = err?.response?.data?.message || err.message || 'OTP không hợp lệ hoặc đã hết hạn';
        set({ isLoading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    },

    // Đặt lại mật khẩu với OTP
    resetPassword: async (otp, newPassword) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axiosClient.post('/reset-password', { 
          otp, 
          new_password: newPassword 
        });
        
        // Kiểm tra status trong response data
        if (response.status && response.status !== 200) {
          // Xử lý trường hợp mật khẩu trùng với mật khẩu cũ
          if (response.same_password) {
            throw new Error('Mật khẩu mới không được trùng với mật khẩu cũ');
          }
          throw new Error(response.message || 'Không thể đặt lại mật khẩu');
        }
        
        set({ isLoading: false });
        return response;
      } catch (err) {
        const errorMessage = err?.response?.data?.message || err.message || 'Không thể đặt lại mật khẩu';
        set({ isLoading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    },

    // === CÁC HÀM CẬP NHẬT THÔNG TIN ===

    // Cập nhật thông tin user
    updateUserInfo: async (userData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axiosClient.put('/user-info', userData);
        
        if (response.status === 200 || response.success) {
          // Cập nhật lại thông tin user trong store
          await get().getUserInfo();
          set({ isLoading: false });
          return response;
        } else {
          throw new Error(response.message || 'Cập nhật thất bại');
        }
      } catch (err) {
        const errorMessage = err?.response?.data?.message || 'Cập nhật thông tin user thất bại';
        set({ isLoading: false, error: errorMessage });
        throw new Error(errorMessage);
      }
    },

    // Cập nhật profile
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

    // === HÀM TIỆN ÍCH ===

    // Clear error
    clearError: () => {
      set({ error: null });
    },

    // Set loading manually
    setLoading: (loading) => {
      set({ isLoading: loading });
    },
  };
});

export default useAuthStore;