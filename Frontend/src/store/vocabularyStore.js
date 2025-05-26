// src/store/vocabularyStore.js
import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

const useVocabularyStore = create((set, get) => ({
  // === STATE ===
  reviewVocabulary: [], // Từ vựng cần ôn tập
  lessonVocabulary: [], // Từ vựng của bài học đang học
  searchResults: [], // Kết quả tìm kiếm
  notebookVocabulary: [], // Từ vựng trong sổ tay (legacy)
  currentVocabIndex: 0, // Index của từ vựng hiện tại
  showMeaning: false, // Trạng thái hiển thị nghĩa
  isLoading: false,
  error: null,
  hasNoWordsToReview: false, // Trạng thái không có từ nào để ôn tập
  currentLesson: null, // Bài học hiện tại
  vocabularyStatsByType: [], // Thống kê từ vựng theo loại từ
  
  // STATE CHO TÍNH NĂNG SỔ TAY
  notebookData: {
    all: [],
    memorized: [],
    not_memorized: [],
    stats: {
      total: 0,
      memorized_count: 0,
      not_memorized_count: 0
    }
  },
  reviewMode: null, // 'notebook' | 'recent' | null
  currentReviewType: null, // 'memorized' | 'not_memorized' | null
  
  // === BASIC METHODS ===
  
  // Thiết lập index của từ vựng hiện tại
  setCurrentVocabIndex: (index) => {
    set({ currentVocabIndex: index });
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
  
  // Reset chế độ ôn tập
  resetReviewMode: () => {
    set({
      reviewMode: null,
      currentReviewType: null,
      showMeaning: false
    });
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
  },
  
  // === VOCABULARY FETCHING METHODS ===
  
  // Lấy danh sách từ vựng cần ôn tập
  fetchReviewVocabulary: async () => {
    set({ isLoading: true, error: null, hasNoWordsToReview: false });
    try {
      const response = await axiosClient.get('/words-to-review?limit=100');
      
      if (response && response.data) {
        if (response.data.status === 200) {
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
      return [];
    }
  },
  
  // Lấy từ vựng 2 ngày gần đây
  fetchRecentVocabulary: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get('/today-yesterday-vocabulary');
      
      if (response && response.data) {
        if (response.data.status === 200) {
          return response.data.data || [];
        } else if (Array.isArray(response.data)) {
          return response.data;
        } else {
          console.warn("API trả về dữ liệu không đúng định dạng:", response.data);
          return [];
        }
      } else {
        console.warn('Không có dữ liệu trả về từ API');
        return [];
      }
    } catch (error) {
      console.error("Lỗi khi tải từ vựng gần đây:", error);
      return [];
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Lấy từ vựng tương tự
  fetchSimilarWords: async (vocabId, wordType, limit = 5) => {
    set({ isLoading: true, error: null });
    try {
      const url = `/similar-words?vocab_id=${vocabId}&word_type=${encodeURIComponent(wordType)}&limit=${limit}`;
      
      const response = await axiosClient.get(url);
      
      if (response && response.data) {
        if (response.data.status === 200 && response.data.data) {
          const wordsData = response.data.data || [];
          set({ isLoading: false });
          return wordsData;
        } else if (Array.isArray(response.data)) {
          set({ isLoading: false });
          return response.data;
        } else {
          console.warn("API trả về dữ liệu không đúng định dạng:", response.data);
          set({ 
            isLoading: false,
            error: "Dữ liệu không đúng định dạng" 
          });
          return [];
        }
      } else {
        throw new Error('Không có dữ liệu từ vựng tương tự trả về từ API');
      }
    } catch (error) {
      console.error("Lỗi khi lấy từ vựng tương tự:", error);
      set({ 
        error: error.message || 'Không thể lấy từ vựng tương tự', 
        isLoading: false
      });
      return [];
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
  
  // Lấy từ vựng trong sổ tay (legacy)
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
        notebookVocabulary: []
      });
      return [];
    }
  },
  
  // Lấy thống kê từ vựng theo loại từ
  fetchVocabularyStatsByType: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get('/vocabulary-stats-by-type');
      
      if (response && response.data) {
        if (response.data.status === 200 && response.data.data) {
          const statsData = response.data.data || [];
          set({ 
            vocabularyStatsByType: statsData, 
            isLoading: false 
          });
          return statsData;
        } else if (Array.isArray(response.data)) {
          set({ 
            vocabularyStatsByType: response.data, 
            isLoading: false 
          });
          return response.data;
        } else {
          console.warn("API trả về dữ liệu không đúng định dạng:", response.data);
          set({ 
            vocabularyStatsByType: [],
            isLoading: false,
            error: "Dữ liệu thống kê không đúng định dạng" 
          });
          return [];
        }
      } else {
        throw new Error('Không có dữ liệu thống kê từ vựng trả về từ API');
      }
    } catch (error) {
      console.error("Lỗi khi lấy thống kê từ vựng:", error);
      set({ 
        error: error.message || 'Không thể lấy thống kê từ vựng theo loại', 
        isLoading: false,
        vocabularyStatsByType: []
      });
      return [];
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
  
  // === NOTEBOOK METHODS (SỔ TAY) ===
  
  // Lấy từ vựng đã thuộc
  fetchMemorizedVocabulary: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get('/notebook-memorized');
      
      if (response && response.data) {
        let vocabData = [];
        
        if (response.data.status === 200) {
          vocabData = response.data.data || [];
        } else if (Array.isArray(response.data)) {
          vocabData = response.data;
        }
        
        set({ 
          reviewVocabulary: vocabData,
          currentVocabIndex: 0,
          hasNoWordsToReview: vocabData.length === 0,
          isLoading: false,
          reviewMode: 'notebook',
          currentReviewType: 'memorized'
        });
        return vocabData;
      } else {
        throw new Error('Không có dữ liệu trả về từ API');
      }
    } catch (error) {
      set({ 
        error: error.message || 'Không thể tải từ vựng đã thuộc', 
        isLoading: false,
        reviewVocabulary: [],
        hasNoWordsToReview: true
      });
      return [];
    }
  },

  // Lấy từ vựng chưa thuộc
  fetchNotMemorizedVocabulary: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get('/notebook-not-memorized');
      
      if (response && response.data) {
        let vocabData = [];
        
        if (response.data.status === 200) {
          vocabData = response.data.data || [];
        } else if (Array.isArray(response.data)) {
          vocabData = response.data;
        }
        
        set({ 
          reviewVocabulary: vocabData,
          currentVocabIndex: 0,
          hasNoWordsToReview: vocabData.length === 0,
          isLoading: false,
          reviewMode: 'notebook',
          currentReviewType: 'not_memorized'
        });
        return vocabData;
      } else {
        throw new Error('Không có dữ liệu trả về từ API');
      }
    } catch (error) {
      set({ 
        error: error.message || 'Không thể tải từ vựng chưa thuộc', 
        isLoading: false,
        reviewVocabulary: [],
        hasNoWordsToReview: true
      });
      return [];
    }
  },

  // Lấy tất cả từ vựng trong sổ tay với thống kê
  fetchNotebookVocabularyStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get('/notebook-all');
      
      if (response && response.data) {
        let notebookInfo = {
          all: [],
          memorized: [],
          not_memorized: [],
          stats: { total: 0, memorized_count: 0, not_memorized_count: 0 }
        };
        
        if (response.data.status === 200) {
          notebookInfo = response.data.data || notebookInfo;
        } else if (response.data.all && Array.isArray(response.data.all)) {
          notebookInfo = response.data;
        }
        
        set({ 
          notebookData: notebookInfo,
          isLoading: false 
        });
        return notebookInfo;
      } else {
        throw new Error('Không có dữ liệu trả về từ API');
      }
    } catch (error) {
      set({ 
        error: error.message || 'Không thể tải sổ tay từ vựng', 
        isLoading: false,
        notebookData: {
          all: [],
          memorized: [],
          not_memorized: [],
          stats: { total: 0, memorized_count: 0, not_memorized_count: 0 }
        }
      });
      return {
        all: [],
        memorized: [],
        not_memorized: [],
        stats: { total: 0, memorized_count: 0, not_memorized_count: 0 }
      };
    }
  },

  // Bắt đầu ôn tập từ sổ tay
  startNotebookReview: async (reviewType) => {
    set({ isLoading: true, error: null });
    try {
      let vocabularyData = [];
      
      if (reviewType === 'memorized') {
        vocabularyData = await get().fetchMemorizedVocabulary();
      } else if (reviewType === 'not_memorized') {
        vocabularyData = await get().fetchNotMemorizedVocabulary();
      } else {
        throw new Error('Loại ôn tập không hợp lệ');
      }
      
      if (vocabularyData && vocabularyData.length > 0) {
        set({
          reviewVocabulary: vocabularyData,
          currentVocabIndex: 0,
          hasNoWordsToReview: false,
          isLoading: false,
          reviewMode: 'notebook',
          currentReviewType: reviewType
        });
        return vocabularyData;
      } else {
        set({
          reviewVocabulary: [],
          hasNoWordsToReview: true,
          isLoading: false
        });
        throw new Error(`Không có từ vựng ${reviewType === 'memorized' ? 'đã thuộc' : 'chưa thuộc'} để ôn tập`);
      }
    } catch (error) {
      set({ 
        error: error.message || 'Không thể bắt đầu ôn tập', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // === VOCABULARY STATUS METHODS ===
  
  // Đánh dấu đã nhớ/chưa nhớ từ vựng
  markVocabularyStatus: async (vocabId, isMemorized) => {
    try {
      if (!vocabId) {
        throw new Error("Thiếu vocab_id");
      }
      
      const isMemorizedValue = isMemorized ? 1 : 0;
      
      const response = await axiosClient.post('/update-vocab-progress', { 
        vocab_id: vocabId, 
        is_memorized: isMemorizedValue
      });
      
      if (response.status === 200) {
        set(state => {
          const updateList = (list) => list.map(vocab => {
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
      
      await get().markVocabularyStatus(vocabId, isMemorized);
      
      return get().nextVocabulary();
    } catch (error) {
      console.error('Lỗi khi đánh dấu và chuyển từ:', error);
      throw error;
    }
  }
}));

export default useVocabularyStore;