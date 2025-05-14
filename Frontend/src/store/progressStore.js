// src/store/progressStore.js
import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

const useProgressStore = create((set, get) => ({
  // Dữ liệu tiến độ
  overallProgress: {
    total_learned: 0,
    total_memorized: 0,
    total_words: 0,
    percentage: 0
  },
  
  topicProgress: [],
  progress: [], // Tiến độ học từng từ
  
  isLoading: false,
  error: null,
  
  // Lấy thống kê tiến độ tổng quan
  fetchProgressStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get('/progress-stats');
      if (response.status === 200) {
        set({ 
          overallProgress: response.data,
          isLoading: false 
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tải thống kê tiến độ');
      }
    } catch (error) {
      set({ 
        error: error.message || 'Không thể tải thống kê tiến độ', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Lấy tiến độ theo chủ đề
  fetchTopicsWithProgress: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get('/topics-with-progress');
      if (response.status === 200) {
        set({ 
          topicProgress: response.data,
          isLoading: false 
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tải tiến độ chủ đề');
      }
    } catch (error) {
      set({ 
        error: error.message || 'Không thể tải tiến độ chủ đề', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Lấy tiến độ học từng từ
  fetchUserProgress: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get('/user-progress');
      if (response.status === 200) {
        set({ 
          progress: response.data,
          isLoading: false 
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tải tiến độ học');
      }
    } catch (error) {
      set({ 
        error: error.message || 'Không thể tải tiến độ học', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Hàm lấy tất cả dữ liệu tiến độ
  fetchAllProgress: async () => {
    set({ isLoading: true, error: null });
    try {
      // Thực hiện cả 3 request
      await Promise.all([
        get().fetchProgressStats(),
        get().fetchTopicsWithProgress(),
        get().fetchUserProgress()
      ]);
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error.message || 'Không thể tải dữ liệu tiến độ', 
        isLoading: false 
      });
      throw error;
    }
  }
}));

export default useProgressStore;