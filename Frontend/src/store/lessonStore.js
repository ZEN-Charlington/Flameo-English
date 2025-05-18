// src/store/lessonStore.js
import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

export const useLessonStore = create((set) => ({
  lessons: [],
  currentLesson: null,
  lessonVocabulary: [],
  topicLessons: [],
  isLoading: false,
  error: null,
  
  // Lấy tất cả bài học
  fetchAllLessons: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get('/lessons');
      
      // Kiểm tra status với nhiều kiểu response khác nhau
      if (response.status === 'success' || response.status === 200) {
        set({ 
          lessons: response.data || [], 
          isLoading: false 
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tải danh sách bài học');
      }
    } catch (error) {
      console.error("Error in fetchAllLessons:", error);
      set({ 
        error: error.message || 'Không thể tải danh sách bài học', 
        isLoading: false 
      });
      return [];
    }
  },
  
  // Lấy chi tiết bài học
  fetchLesson: async (lessonId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get(`/lessons/${lessonId}`);
      
      if ((response.status === 'success' || response.status === 200) && response.data) {
        set({ 
          currentLesson: response.data.lesson,
          isLoading: false 
        });
        return response;
      } else {
        console.error("Error response:", response);
        set({ 
          error: response.message || 'Không thể tải thông tin bài học', 
          isLoading: false 
        });
        return null;
      }
    } catch (error) {
      console.error("Error in fetchLesson:", error);
      set({ 
        error: error.message || 'Không thể tải thông tin bài học', 
        isLoading: false 
      });
      return null; // Return null instead of throwing
    }
  },

  // Lấy từ vựng của bài học
  fetchLessonVocabulary: async (lessonId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get(`/lesson-vocabulary?lesson_id=${lessonId}`);
      
      if ((response.status === 'success' || response.status === 200) && response.data) {
        set({ 
          lessonVocabulary: response.data, 
          isLoading: false 
        });
        return response;
      } else {
        console.error("Error response:", response);
        set({ 
          error: response.message || 'Không thể tải từ vựng của bài học', 
          isLoading: false,
          lessonVocabulary: [] // Reset vocabulary to avoid errors
        });
        return [];
      }
    } catch (error) {
      console.error("Error in fetchLessonVocabulary:", error);
      set({ 
        error: error.message || 'Không thể tải từ vựng của bài học', 
        isLoading: false,
        lessonVocabulary: [] // Reset vocabulary to avoid errors
      });
      return []; // Return empty array instead of throwing
    }
  },
  
  // Lấy bài học theo chủ đề
  fetchLessonsByTopic: async (topicId) => {
    set({ isLoading: true, error: null });
    try {
      
      // Kiểm tra token
      const token = localStorage.getItem('token');
      // Gọi API
      const response = await axiosClient.get(`/topic-lessons?topic_id=${topicId}`);
      
      // Kiểm tra response
      if ((response.status === 'success' || response.status === 200) && response.data) {
        set({ 
          topicLessons: response.data, 
          isLoading: false 
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tải bài học của chủ đề');
      }
    } catch (error) {
      console.error("Full error details:", error);
      set({ 
        error: error.message || 'Không thể tải bài học của chủ đề', 
        isLoading: false,
        topicLessons: [] // Đặt mảng rỗng để tránh lỗi khi render
      });
      return [];
    }
  }
}));

export default useLessonStore;