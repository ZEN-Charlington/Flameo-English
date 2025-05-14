// src/store/vocabularyStore.js
import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

// API service cho từ vựng
const vocabularyService = {
  // Lấy danh sách từ vựng cần ôn tập
  getReviewVocabulary: () => axiosClient.get('/words-to-review'),
  
  // Lấy danh sách từ vựng mới
  getNewVocabulary: () => axiosClient.get('/random-vocabulary?limit=20'),
  
  // Cập nhật trạng thái từ vựng
  updateVocabularyStatus: (vocabId, isMemorized) => 
    axiosClient.post('/update-vocab-progress', { vocab_id: vocabId, is_memorized: isMemorized }),
  
  // Tìm kiếm từ vựng
  searchVocabulary: (keyword) => axiosClient.get(`/search-vocabulary?keyword=${keyword}`),
};

const useVocabularyStore = create((set, get) => ({
  reviewVocabulary: [], // Từ vựng cần ôn tập
  newVocabulary: [], // Từ vựng mới
  searchResults: [], // Kết quả tìm kiếm
  allVocabulary: [], // Tất cả từ vựng
  currentVocabIndex: 0, // Index của từ vựng hiện tại
  showMeaning: false, // Trạng thái hiển thị nghĩa
  isReviewMode: true, // Chế độ ôn tập hoặc học từ mới
  isLoading: false,
  error: null,
  
  // Lấy danh sách từ vựng cần ôn tập
  fetchReviewVocabulary: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await vocabularyService.getReviewVocabulary();
      if (response.status === 200) {
        set({ 
          reviewVocabulary: response.data || [], 
          currentVocabIndex: 0,
          showMeaning: false,
          isLoading: false 
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tải từ vựng cần ôn tập');
      }
    } catch (error) {
      set({ 
        error: error.message || 'Không thể tải từ vựng cần ôn tập', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Lấy danh sách từ vựng mới
  fetchNewVocabulary: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await vocabularyService.getNewVocabulary();
      if (response.status === 200) {
        set({ 
          newVocabulary: response.data || [], 
          currentVocabIndex: 0,
          showMeaning: false,
          isLoading: false 
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tải từ vựng mới');
      }
    } catch (error) {
      set({ 
        error: error.message || 'Không thể tải từ vựng mới', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Lấy tất cả từ vựng
  fetchAllVocabulary: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get('/vocabulary');
      if (response.status === 200) {
        set({ 
          allVocabulary: response.data || [], 
          isLoading: false 
        });
        return response.data;
      } else {
        throw new Error(response.message || 'Không thể tải tất cả từ vựng');
      }
    } catch (error) {
      set({ 
        error: error.message || 'Không thể tải tất cả từ vựng', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Chuyển sang từ vựng tiếp theo
  nextVocabulary: () => {
    const { currentVocabIndex, reviewVocabulary, newVocabulary, isReviewMode } = get();
    const currentList = isReviewMode ? reviewVocabulary : newVocabulary;
    
    if (currentVocabIndex < currentList.length - 1) {
      set({ 
        currentVocabIndex: currentVocabIndex + 1,
        showMeaning: false
      });
    }
  },
  
  // Quay lại từ vựng trước đó
  previousVocabulary: () => {
    const { currentVocabIndex } = get();
    if (currentVocabIndex > 0) {
      set({ 
        currentVocabIndex: currentVocabIndex - 1,
        showMeaning: false
      });
    }
  },
  
  // Hiển thị/ẩn nghĩa
  toggleMeaning: () => {
    set(state => ({ showMeaning: !state.showMeaning }));
  },
  
  // Đánh dấu đã nhớ/chưa nhớ từ vựng
  markVocabularyStatus: async (vocabId, isMemorized) => {
    try {
      const response = await vocabularyService.updateVocabularyStatus(vocabId, isMemorized);
      if (response.status === 200) {
        // Cập nhật state
        set(state => {
          const updateList = (list) => list.map(vocab => 
            vocab.vocab_id === vocabId ? {...vocab, is_memorized: isMemorized} : vocab
          );
          
          return {
            reviewVocabulary: updateList(state.reviewVocabulary),
            newVocabulary: updateList(state.newVocabulary),
            allVocabulary: updateList(state.allVocabulary),
            searchResults: updateList(state.searchResults)
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
  
  // Tìm kiếm từ vựng
  searchVocabulary: async (keyword) => {
    set({ isLoading: true, error: null });
    try {
      const response = await vocabularyService.searchVocabulary(keyword);
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
  
  // Chế độ ôn tập hoặc học từ mới
  setReviewMode: (isReviewMode) => {
    set({ 
      isReviewMode,
      currentVocabIndex: 0,
      showMeaning: false
    });
  }
}));

export default useVocabularyStore;