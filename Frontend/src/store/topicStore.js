// src/store/topicStore.js
import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

const useTopicStore = create((set) => ({
  topics: [],
  currentTopic: null,
  topicsWithProgress: [],
  isLoadingTopics: false,
  error: null,
  
  // Lấy tất cả chủ đề
  fetchAllTopics: async () => {
    set({ isLoadingTopics: true, error: null });
    try {
      // Trước hết thử lấy dữ liệu với tiến độ
      const response = await axiosClient.get('/topics?with_progress=1');
      
      // Kiểm tra status với nhiều kiểu response khác nhau
      if (response.status === 'success' || response.status === 200) {
        set({ 
          topics: response.data || [], 
          isLoadingTopics: false 
        });
        return response.data;
      } else {
        // Nếu không lấy được với tiến độ, thử lấy dữ liệu thông thường
        return await fallbackToRegularTopics();
      }
    } catch (error) {
      console.error("Error in fetchAllTopics:", error);
      // Thử lấy data thông thường khi gặp lỗi
      return await fallbackToRegularTopics();
    }
  },
  
  // Lấy chi tiết chủ đề
  fetchTopic: async (topicId) => {
    set({ isLoadingTopics: true, error: null });
    try {
      // Trước hết thử lấy dữ liệu với tiến độ
      const response = await axiosClient.get(`/topics/${topicId}?with_progress=1`);
      
      if (response.status === 'success' || response.status === 200) {
        // Đảm bảo dữ liệu có các trường cần thiết
        const topicData = ensureTopicDataFields(response.data);
        
        set({ 
          currentTopic: topicData, 
          isLoadingTopics: false 
        });
        return topicData;
      } else {
        // Nếu không lấy được với tiến độ, thử lấy dữ liệu thông thường
        return await fallbackToRegularTopic(topicId);
      }
    } catch (error) {
      console.error("Error in fetchTopic:", error);
      // Thử lấy data thông thường khi gặp lỗi
      return await fallbackToRegularTopic(topicId);
    }
  },
  
  // Lấy chủ đề kèm tiến độ học
  fetchTopicsWithProgress: async () => {
    set({ isLoadingTopics: true, error: null });
    try {
      // Lấy danh sách topics với tiến độ
      const response = await axiosClient.get('/topics?with_progress=1');
      
      if (response.status === 'success' || response.status === 200) {
        // Đảm bảo mỗi topic có đầy đủ thông tin cần thiết
        const topicsData = response.data || [];
        const processedTopics = topicsData.map(topic => ensureTopicDataFields(topic));
        
        set({ 
          topicsWithProgress: processedTopics,
          topics: processedTopics, // Cập nhật cả topics với dữ liệu kèm tiến độ
          isLoadingTopics: false 
        });
        return processedTopics;
      } else {
        // Nếu không thành công, thử gọi API topics thông thường
        return await fallbackToRegularTopics();
      }
    } catch (error) {
      console.error("Error in fetchTopicsWithProgress:", error);
      // Nếu lỗi, thử gọi API topics thông thường
      return await fallbackToRegularTopics();
    }
  }
}));

// Hàm phụ trợ để đảm bảo dữ liệu topic có đầy đủ các trường cần thiết
function ensureTopicDataFields(topic) {
  if (!topic) return null;
  
  return {
    ...topic,
    // Đảm bảo có các trường cần thiết, hoặc gán giá trị mặc định
    total_words: topic.total_words || 0,
    total_learned: topic.total_learned || 0,
    total_memorized: topic.total_memorized || 0,
    completed_percentage: topic.completed_percentage || 0,
    lesson_count: topic.lesson_count || 0,
    completed_lessons: topic.completed_lessons || 0
  };
}

// Hàm phụ trợ để gọi API topics nếu API topics-with-progress thất bại
async function fallbackToRegularTopics() {
  try {
    const topicsResponse = await axiosClient.get('/topics');
    
    if (topicsResponse.status === 'success' || topicsResponse.status === 200) {
      const topicsData = topicsResponse.data || [];
      const processedTopics = topicsData.map(topic => ensureTopicDataFields(topic));
      
      useTopicStore.setState({ 
        topics: processedTopics, 
        isLoadingTopics: false 
      });
      return processedTopics;
    } else {
      throw new Error(topicsResponse.message || 'Không thể tải danh sách chủ đề');
    }
  } catch (error) {
    console.error("Error in fallback to /topics:", error);
    useTopicStore.setState({ 
      error: error.message || 'Không thể tải danh sách chủ đề', 
      isLoadingTopics: false 
    });
    return [];
  }
}

// Hàm phụ trợ để lấy thông tin của một chủ đề cụ thể khi không lấy được với tiến độ
async function fallbackToRegularTopic(topicId) {
  try {
    const topicResponse = await axiosClient.get(`/topics/${topicId}`);
    
    if (topicResponse.status === 'success' || topicResponse.status === 200) {
      const topicData = ensureTopicDataFields(topicResponse.data);
      
      useTopicStore.setState({ 
        currentTopic: topicData, 
        isLoadingTopics: false 
      });
      return topicData;
    } else {
      throw new Error(topicResponse.message || 'Không thể tải thông tin chủ đề');
    }
  } catch (error) {
    console.error("Error in fallback to regular topic:", error);
    useTopicStore.setState({ 
      error: error.message || 'Không thể tải thông tin chủ đề', 
      isLoadingTopics: false 
    });
    return null;
  }
}

export default useTopicStore;