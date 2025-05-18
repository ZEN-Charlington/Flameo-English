// src/store/vocabularyStore.js
import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

const useVocabularyStore = create((set, get) => ({
  reviewVocabulary: [], // Từ vựng cần ôn tập
  lessonVocabulary: [], // Từ vựng của bài học đang học
  searchResults: [], // Kết quả tìm kiếm
  notebookVocabulary: [], // Từ vựng trong sổ tay
  currentVocabIndex: 0, // Index của từ vựng hiện tại
  showMeaning: false, // Trạng thái hiển thị nghĩa
  isLoading: false,
  error: null,
  hasNoWordsToReview: false, // Trạng thái không có từ nào để ôn tập
  currentLesson: null, // Bài học hiện tại
  vocabularyStatsByType: [], // Thống kê từ vựng theo loại từ
  
  // Thiết lập index của từ vựng hiện tại
  setCurrentVocabIndex: (index) => {
    set({ currentVocabIndex: index });
  },
  
  // Lấy danh sách từ vựng cần ôn tập
  fetchReviewVocabulary: async () => {
    set({ isLoading: true, error: null, hasNoWordsToReview: false });
    try {
      const response = await axiosClient.get('/words-to-review?limit=100');
      
      console.log("API response:", response); // Thêm log để kiểm tra dữ liệu trả về
      
      // Kiểm tra response có cấu trúc đúng không
      if (response && response.data) {
        // Kiểm tra nếu response.data là một đối tượng có thuộc tính 'data' (API format)
        if (response.data.status === 200) {
          // Nếu trả về dữ liệu đúng cấu trúc API của bạn
          const vocabData = response.data.data || [];
          
          if (vocabData.length === 0) {
            set({ 
              reviewVocabulary: [], 
              hasNoWordsToReview: true,
              isLoading: false 
            });
          } else {
            set({ 
              reviewVocabulary: vocabData, 
              currentVocabIndex: 0,
              showMeaning: false,
              hasNoWordsToReview: false,
              isLoading: false 
            });
          }
          return vocabData;
        } else if (Array.isArray(response.data)) {
          // Nếu trả về trực tiếp mảng dữ liệu
          if (response.data.length === 0) {
            set({ 
              reviewVocabulary: [], 
              hasNoWordsToReview: true,
              isLoading: false 
            });
          } else {
            set({ 
              reviewVocabulary: response.data, 
              currentVocabIndex: 0,
              showMeaning: false,
              hasNoWordsToReview: false,
              isLoading: false 
            });
          }
          return response.data;
        } else {
          // Có dữ liệu trả về nhưng không đúng định dạng mong đợi
          console.warn("API trả về dữ liệu không đúng định dạng:", response.data);
          set({ 
            reviewVocabulary: [], 
            hasNoWordsToReview: true,
            isLoading: false,
            error: "Dữ liệu không đúng định dạng" 
          });
          return [];
        }
      } else {
        // Không có dữ liệu trả về
        throw new Error('Không có dữ liệu trả về từ API');
      }
    } catch (error) {
      console.error("Lỗi chi tiết:", error);
      set({ 
        error: error.message || 'Không thể tải từ vựng cần ôn tập', 
        isLoading: false,
        reviewVocabulary: [],
        hasNoWordsToReview: true
      });
      return []; // Trả về mảng rỗng thay vì throw error
    }
  },
  
  // Thêm phương thức mới để lấy từ vựng 2 ngày gần đây
  fetchRecentVocabulary: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get('/today-yesterday-vocabulary');
      
      console.log("Recent vocab API response:", response); // Thêm log để kiểm tra dữ liệu trả về
      
      // Kiểm tra response có cấu trúc đúng không 
      if (response && response.data) {
        // Kiểm tra nếu response.data là một đối tượng có thuộc tính 'data' (API format)
        if (response.data.status === 200) {
          // Nếu trả về dữ liệu đúng cấu trúc API của bạn
          return response.data.data || [];
        } else if (Array.isArray(response.data)) {
          // Nếu trả về trực tiếp mảng dữ liệu
          return response.data;
        } else {
          // Có dữ liệu trả về nhưng không đúng định dạng mong đợi
          console.warn("API trả về dữ liệu không đúng định dạng:", response.data);
          return [];
        }
      } else {
        // Không có dữ liệu trả về
        console.warn('Không có dữ liệu trả về từ API');
        return [];
      }
    } catch (error) {
      console.error("Lỗi khi tải từ vựng gần đây:", error);
      return []; // Trả về mảng rỗng thay vì throw error
    } finally {
      set({ isLoading: false });
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
          currentVocabIndex: 0,
          showMeaning: false,
          currentLesson: lessonId,
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
  
  // LẤY TỪ VỰNG TRONG SỔ TAY (NOTEBOOK)
  fetchNotebookVocabulary: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get('/notebook-vocabulary');
      if (response.status === 200) {
        set({ 
          notebookVocabulary: response.data || [], 
          isLoading: false 
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tải từ vựng sổ tay');
      }
    } catch (error) {
      console.error('Error in fetchNotebookVocabulary:', error);
      set({ 
        error: error.message || 'Không thể tải từ vựng sổ tay', 
        isLoading: false,
        notebookVocabulary: [] // Đảm bảo là mảng rỗng khi có lỗi
      });
      return [];
    }
  },
  
  // Lấy thống kê từ vựng theo loại từ
  fetchVocabularyStatsByType: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get('/vocabulary-stats-by-type');
      
      console.log("Vocabulary stats by type API response:", response); // Log kiểm tra dữ liệu trả về
      
      if (response && response.data) {
        // Kiểm tra cấu trúc phản hồi
        if (response.data.status === 200 && response.data.data) {
          // Đúng cấu trúc API có status và data
          const statsData = response.data.data || [];
          set({ 
            vocabularyStatsByType: statsData, 
            isLoading: false 
          });
          return statsData;
        } else if (Array.isArray(response.data)) {
          // API trả về trực tiếp là mảng (không có status và data)
          console.log("API trả về trực tiếp là mảng dữ liệu:", response.data);
          set({ 
            vocabularyStatsByType: response.data, 
            isLoading: false 
          });
          return response.data;
        } else {
          // Có dữ liệu nhưng không đúng định dạng mong đợi
          console.warn("API trả về dữ liệu không đúng định dạng:", response.data);
          set({ 
            vocabularyStatsByType: [],
            isLoading: false,
            error: "Dữ liệu thống kê không đúng định dạng" 
          });
          return [];
        }
      } else {
        // Không có dữ liệu trả về
        throw new Error('Không có dữ liệu thống kê từ vựng trả về từ API');
      }
    } catch (error) {
      console.error("Lỗi khi lấy thống kê từ vựng:", error);
      set({ 
        error: error.message || 'Không thể lấy thống kê từ vựng theo loại', 
        isLoading: false,
        vocabularyStatsByType: []
      });
      return []; // Trả về mảng rỗng khi có lỗi
    }
  },
  
  // Chuyển sang từ vựng tiếp theo
  nextVocabulary: () => {
    const { currentVocabIndex, reviewVocabulary } = get();
    
    if (currentVocabIndex < reviewVocabulary.length - 1) {
      const nextIndex = currentVocabIndex + 1;
      set({ currentVocabIndex: nextIndex });
      return true;
    } else {
      return false;
    }
  },
  
  // Quay lại từ vựng trước đó
  previousVocabulary: () => {
    const { currentVocabIndex } = get();
    if (currentVocabIndex > 0) {
      const prevIndex = currentVocabIndex - 1;
      set({ 
        currentVocabIndex: prevIndex,
        showMeaning: false
      });
      return true;
    }
    return false;
  },
  
  // Hiển thị/ẩn nghĩa
  toggleMeaning: () => {
    set(state => ({ showMeaning: !state.showMeaning }));
  },
  
  // Đánh dấu đã nhớ/chưa nhớ từ vựng
  markVocabularyStatus: async (vocabId, isMemorized) => {
    try {
      if (!vocabId) {
        throw new Error("Thiếu vocab_id");
      }
      
      // Chuyển đổi isMemorized thành số nguyên (0 hoặc 1)
      const isMemorizedValue = isMemorized ? 1 : 0;
      
      const response = await axiosClient.post('/update-vocab-progress', { 
        vocab_id: vocabId, 
        is_memorized: isMemorizedValue  // Đảm bảo gửi số nguyên
      });
      
      if (response.status === 200) {
        // Cập nhật state
        set(state => {
          const updateList = (list) => list.map(vocab => {
            // Kiểm tra cả vocab_id và id
            if ((vocab.vocab_id && vocab.vocab_id === vocabId) || 
                (vocab.id && vocab.id === vocabId)) {
              return {...vocab, is_memorized: isMemorizedValue};
            }
            return vocab;
          });
          
          return {
            reviewVocabulary: updateList(state.reviewVocabulary),
            lessonVocabulary: updateList(state.lessonVocabulary),
            searchResults: updateList(state.searchResults),
            notebookVocabulary: updateList(state.notebookVocabulary)
          };
        });
        return true;
      } else {
        throw new Error(response.message || 'Không thể cập nhật trạng thái từ vựng');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái từ vựng:', error);
      throw error;
    }
  },
  
  // Bỏ qua từ hiện tại và chuyển sang từ tiếp theo
  skipCurrentWord: () => {
    const { nextVocabulary } = get();
    return nextVocabulary();
  },
  
  // Đánh dấu từ vựng đã nhớ và chuyển sang từ tiếp theo
  markAndNext: async (vocabId, isMemorized) => {
    try {
      if (!vocabId) {
        throw new Error("Thiếu vocab_id");
      }
      
      // Đánh dấu trạng thái
      await get().markVocabularyStatus(vocabId, isMemorized);
      
      // Chuyển sang từ tiếp theo
      return get().nextVocabulary();
    } catch (error) {
      console.error('Lỗi khi đánh dấu và chuyển từ:', error);
      throw error;
    }
  },
  
  // Tìm kiếm từ vựng
  searchVocabulary: async (keyword) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get(`/search-vocabulary?keyword=${keyword}`);
      if (response.status === 200) {
        set({ 
          searchResults: response.data || [], 
          isLoading: false 
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tìm kiếm từ vựng');
      }
    } catch (error) {
      set({ 
        error: error.message || 'Không thể tìm kiếm từ vựng', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Reset store state
  resetStore: () => {
    set({
      currentVocabIndex: 0,
      showMeaning: false,
      error: null
    });
  },
  
  // Chuyển đổi chế độ ôn tập/học từ mới
  setReviewMode: (isReviewMode) => {
    set({ 
      isReviewMode,
      currentVocabIndex: 0,
      showMeaning: false
    });
  },
  
  // Xóa lỗi
  clearError: () => {
    set({ error: null });
  }
}));

export default useVocabularyStore;