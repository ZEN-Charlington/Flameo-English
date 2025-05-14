// src/store/lessonStore.js
import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

const useLessonStore = create((set) => ({
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
      if (response.status === 200) {
        set({ 
          lessons: response.data || [], 
          isLoading: false 
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tải danh sách bài học');
      }
    } catch (error) {
      set({ 
        error: error.message || 'Không thể tải danh sách bài học', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Lấy chi tiết bài học
  fetchLesson: async (lessonId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get(`/lessons/${lessonId}`);
      if (response.status === 200) {
        set({ 
          currentLesson: response.data.lesson,
          lessonVocabulary: response.data.vocabulary || [],
          isLoading: false 
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tải thông tin bài học');
      }
    } catch (error) {
      set({ 
        error: error.message || 'Không thể tải thông tin bài học', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Lấy từ vựng của bài học
  fetchLessonVocabulary: async (lessonId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get(`/lesson-vocabulary?lesson_id=${lessonId}`);
      if (response.status === 200) {
        set({ 
          lessonVocabulary: response.data || [],
          isLoading: false 
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tải từ vựng của bài học');
      }
    } catch (error) {
      set({ 
        error: error.message || 'Không thể tải từ vựng của bài học', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Lấy bài học theo chủ đề
  fetchLessonsByTopic: async (topicId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get(`/topic-lessons?topic_id=${topicId}`);
      if (response.status === 200) {
        set({ 
          topicLessons: response.data || [],
          isLoading: false 
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tải bài học của chủ đề');
      }
    } catch (error) {
      set({ 
        error: error.message || 'Không thể tải bài học của chủ đề', 
        isLoading: false 
      });
      throw error;
    }
  }
}));

export default useLessonStore;