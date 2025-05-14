// src/store/topicStore.js
import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

const useTopicStore = create((set) => ({
  topics: [],
  currentTopic: null,
  topicsWithProgress: [],
  isLoading: false,
  error: null,
  
  // Lấy tất cả chủ đề
  fetchAllTopics: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get('/topics');
      if (response.status === 200) {
        set({ 
          topics: response.data || [], 
          isLoading: false 
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tải danh sách chủ đề');
      }
    } catch (error) {
      set({ 
        error: error.message || 'Không thể tải danh sách chủ đề', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Lấy chi tiết chủ đề
  fetchTopic: async (topicId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get(`/topics/${topicId}`);
      if (response.status === 200) {
        set({ 
          currentTopic: response.data, 
          isLoading: false 
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tải thông tin chủ đề');
      }
    } catch (error) {
      set({ 
        error: error.message || 'Không thể tải thông tin chủ đề', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Lấy chủ đề kèm tiến độ học
  fetchTopicsWithProgress: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get('/topics-with-progress');
      if (response.status === 200) {
        set({ 
          topicsWithProgress: response.data || [], 
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
  }
}));

export default useTopicStore;