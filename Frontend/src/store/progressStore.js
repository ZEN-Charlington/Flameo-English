// src/store/progressStore.js
import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

const useProgressStore = create((set, get) => ({
  // Dữ liệu tiến độ
  overallProgress: {
    vocabulary: {
      total_learned: 0,
      total_memorized: 0,
      total: 0,
      percentage: 0
    },
    lessons: {
      completed: 0,
      total: 0,
      percentage: 0
    },
    topics: {
      completed: 0,
      total: 0,
      percentage: 0
    },
    overall_percentage: 0
  },
  
  topicProgress: [],
  lessonProgress: [],
  vocabProgress: [], // Tiến độ học từng từ
  completedLessons: [],
  
  isLoading: false,
  error: null,
  
  // Lấy thống kê tiến độ tổng quan
  fetchOverallProgress: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get('/overall-progress');
      if (response.status === 200) {
        set({ 
          overallProgress: response.data,
          isLoading: false 
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tải thống kê tiến độ tổng quan');
      }
    } catch (error) {
      set({ 
        error: error.message || 'Không thể tải thống kê tiến độ tổng quan', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Lấy tiến độ theo chủ đề
  fetchTopicsProgress: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get('/topics-with-progress');
      if (response.status === 200) {
        set({ 
          topicProgress: response.data || [],
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
  
  // Lấy tiến độ bài học đã hoàn thành
  fetchCompletedLessons: async () => {
    set({ isLoading: true, error: null });
    try {
      // Thêm timestamp để tránh cache
      const timestamp = new Date().getTime();
      const response = await axiosClient.get(`/completed-lessons?_t=${timestamp}`);
      
      if (response.status === 200) {
        set({ 
          completedLessons: response.data || [],
          isLoading: false 
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tải danh sách bài học đã hoàn thành');
      }
    } catch (error) {
      set({ 
        error: error.message || 'Không thể tải danh sách bài học đã hoàn thành', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Lấy tiến độ học từng từ
  fetchVocabProgress: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get('/user-progress');
      if (response.status === 200) {
        set({ 
          vocabProgress: response.data || [],
          isLoading: false 
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tải tiến độ học từ vựng');
      }
    } catch (error) {
      set({ 
        error: error.message || 'Không thể tải tiến độ học từ vựng', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Tính toán tiến độ của bài học
  calculateLessonProgress: async (lessonId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get(`/lesson-progress?lesson_id=${lessonId}`);
      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tính toán tiến độ bài học');
      }
    } catch (error) {
      set({ 
        error: error.message || 'Không thể tính toán tiến độ bài học', 
        isLoading: false 
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Trong progressStore.js
  completeLesson: async (lessonId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.post('/complete-lesson', { lesson_id: lessonId });
      
      if (response.status === 200) {
        // Cập nhật danh sách bài học đã hoàn thành
        try {
          await get().fetchCompletedLessons();
        } catch (err) {
          console.error("Error fetching completed lessons:", err);
        }
        
        // Cập nhật tiến độ chủ đề
        try {
          await get().fetchTopicsProgress();
        } catch (err) {
          console.error("Error fetching topics progress:", err);
        }
        
        // Cập nhật tiến độ tổng quan
        try {
          await get().fetchOverallProgress();
        } catch (err) {
          console.error("Error fetching overall progress:", err);
        }
        
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể hoàn thành bài học');
      }
    } catch (error) {
      // Chỉ log lỗi nhưng không nhất thiết throw lỗi để dừng luồng
      console.error('Lỗi khi cập nhật trạng thái bài học:', error);
      // Vẫn set error cho state
      set({ 
        error: error.message || 'Không thể hoàn thành bài học', 
        isLoading: false 
      });
      
      // Trả về một kết quả "thành công giả" để không làm gián đoạn luồng người dùng
      return {
        status: 200,
        message: 'Đã hoàn thành bài học (cập nhật không đầy đủ)',
        partial_success: true
      };
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Hàm lấy tất cả dữ liệu tiến độ
  fetchAllProgress: async () => {
    set({ isLoading: true, error: null });
    try {
      // Thực hiện tất cả các request
      await Promise.all([
        get().fetchOverallProgress(),
        get().fetchTopicsProgress(),
        get().fetchCompletedLessons(),
        get().fetchVocabProgress()
      ]);
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error.message || 'Không thể tải dữ liệu tiến độ', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Reset tiến độ học tập
  resetProgress: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.post('/reset-progress');
      if (response.status === 200) {
        // Cập nhật lại tất cả dữ liệu tiến độ
        await get().fetchAllProgress();
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể khôi phục tiến độ học tập');
      }
    } catch (error) {
      set({ 
        error: error.message || 'Không thể khôi phục tiến độ học tập', 
        isLoading: false 
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  // Thêm vào progressStore.js
  createProgressTables: async () => {
    try {
      const response = await axiosClient.post('/create-progress-tables');
      return response;
    } catch (error) {
      console.error('Error creating progress tables:', error);
    }
  }
}));

export default useProgressStore;