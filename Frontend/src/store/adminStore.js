import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

const useAdminStore = create((set, get) => ({
  topics: [],
  lessons: [],
  lessonVocabulary: {},
  statistics: null,
  selectedTopicId: null,
  selectedLessonId: null,
  selectedItems: { topics: [], lessons: [], vocabulary: [] },
  dataFetched: { topics: false, lessons: false, statistics: false },
  loading: { topics: false, lessons: false, vocabulary: false, statistics: false, uploading: false, initializing: false },
  error: null,
  searchKeyword: '',

  // Helper function to refresh all data including statistics
  refreshAllData: async () => {
    await Promise.all([
      get().fetchTopics(true), 
      get().fetchLessons(true), 
      get().fetchStatistics(true)  // Always refresh statistics
    ]);
    const state = get();
    if (state.selectedLessonId) {
      await get().fetchLessonVocabulary(state.selectedLessonId, 1, 10, true);
    }
  },

  initializeAdminData: async () => {
    const state = get();
    if (state.loading.initializing) return;
    set(state => ({ loading: { ...state.loading, initializing: true }, error: null }));
    try {
      await get().refreshAllData();
      console.log('Admin data initialized successfully');
    } catch (error) {
      console.error('Failed to initialize admin data:', error);
      set({ error: error.message });
    } finally {
      set(state => ({ loading: { ...state.loading, initializing: false } }));
    }
  },

  fetchTopics: async (force = false) => {
    const state = get();
    if (!force && state.dataFetched.topics) return;
    console.log('Fetching topics...');
    set(state => ({ loading: { ...state.loading, topics: true }, error: null }));
    try {
      const result = await axiosClient.get('/admin/topics');
      console.log('Topics API Response:', result);
      set({ topics: result.data || [], dataFetched: { ...state.dataFetched, topics: true } });
    } catch (error) {
      console.error('Fetch topics error:', error);
      set({ error: error.message });
    } finally {
      set(state => ({ loading: { ...state.loading, topics: false } }));
    }
  },

  selectTopic: async (topicId) => {
    set({ selectedTopicId: topicId, selectedLessonId: null });
  },

  createTopic: async (topicData) => {
    try {
      set(state => ({ loading: { ...state.loading, topics: true } }));
      const result = await axiosClient.post('/admin/topics', topicData);
      // Refresh all data including statistics
      await get().refreshAllData();
      return result;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set(state => ({ loading: { ...state.loading, topics: false } }));
    }
  },

  updateTopic: async (topicId, topicData) => {
    try {
      set(state => ({ loading: { ...state.loading, topics: true } }));
      const result = await axiosClient.put(`/admin/topics/${topicId}`, topicData);
      await get().fetchTopics(true);
      return result;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set(state => ({ loading: { ...state.loading, topics: false } }));
    }
  },

  toggleTopicActive: async (topicId, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      const result = await axiosClient.put(`/admin/topics/${topicId}`, { is_active: newStatus });
      // Refresh topics and statistics
      await Promise.all([get().fetchTopics(true), get().fetchStatistics(true)]);
      return result;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteTopic: async (topicId) => {
    try {
      const result = await axiosClient.delete(`/admin/topics/${topicId}`);
      // Refresh all data including statistics
      await get().refreshAllData();
      return result;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  fetchLessons: async (force = false) => {
    const state = get();
    if (!force && state.dataFetched.lessons) return;
    console.log('Fetching lessons...');
    set(state => ({ loading: { ...state.loading, lessons: true }, error: null }));
    try {
      const result = await axiosClient.get('/admin/lessons');
      console.log('Lessons API Response:', result);
      set({ lessons: result.data || [], dataFetched: { ...state.dataFetched, lessons: true } });
    } catch (error) {
      console.error('Fetch lessons error:', error);
      set({ error: error.message });
    } finally {
      set(state => ({ loading: { ...state.loading, lessons: false } }));
    }
  },

  selectLesson: (lessonId) => {
    set({ selectedLessonId: lessonId });
    if (lessonId) {
      get().fetchLessonVocabulary(lessonId);
    }
  },

  createLesson: async (lessonData) => {
    try {
      set(state => ({ loading: { ...state.loading, lessons: true } }));
      const result = await axiosClient.post('/admin/lessons', lessonData);
      // Refresh all data including statistics
      await get().refreshAllData();
      return result;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set(state => ({ loading: { ...state.loading, lessons: false } }));
    }
  },

  updateLesson: async (lessonId, lessonData) => {
    try {
      set(state => ({ loading: { ...state.loading, lessons: true } }));
      const result = await axiosClient.put(`/admin/lessons/${lessonId}`, lessonData);
      await get().fetchLessons(true);
      return result;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set(state => ({ loading: { ...state.loading, lessons: false } }));
    }
  },

  toggleLessonActive: async (lessonId, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      const result = await axiosClient.put(`/admin/lessons/${lessonId}`, { is_active: newStatus });
      // Refresh lessons and statistics
      await Promise.all([get().fetchLessons(true), get().fetchStatistics(true)]);
      return result;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteLesson: async (lessonId) => {
    try {
      const result = await axiosClient.delete(`/admin/lessons/${lessonId}`);
      // Refresh all data including statistics
      await get().refreshAllData();
      const state = get();
      const newLessonVocab = { ...state.lessonVocabulary };
      delete newLessonVocab[lessonId];
      set({ lessonVocabulary: newLessonVocab });
      return result;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  fetchLessonVocabulary: async (lessonId, page = 1, limit = 10, force = false) => {
    const state = get();
    const currentData = state.lessonVocabulary[lessonId];
    if (state.loading.vocabulary || (!force && currentData && currentData.pagination?.current_page === page)) {
      return;
    }
    console.log(`Fetching vocabulary for lesson ${lessonId}, page ${page}...`);
    set(state => ({ loading: { ...state.loading, vocabulary: true }, error: null }));
    try {
      const result = await axiosClient.get(`/admin/lessons/${lessonId}/vocabulary?page=${page}&limit=${limit}`);
      console.log('Lesson Vocabulary API Response:', result);
      set(state => ({ lessonVocabulary: { ...state.lessonVocabulary, [lessonId]: result.data } }));
    } catch (error) {
      console.error('Fetch lesson vocabulary error:', error);
      set({ error: error.message });
    } finally {
      set(state => ({ loading: { ...state.loading, vocabulary: false } }));
    }
  },

  searchLessonVocabulary: async (lessonId, keyword, page = 1, limit = 10) => {
    set(state => ({ loading: { ...state.loading, vocabulary: true }, searchKeyword: keyword }));
    try {
      const result = await axiosClient.get(`/admin/lessons/${lessonId}/vocabulary?keyword=${encodeURIComponent(keyword)}&page=${page}&limit=${limit}`);
      set(state => ({ lessonVocabulary: { ...state.lessonVocabulary, [lessonId]: result.data } }));
    } catch (error) {
      set({ error: error.message });
    } finally {
      set(state => ({ loading: { ...state.loading, vocabulary: false } }));
    }
  },

  addVocabularyToLesson: async (lessonId, vocabData) => {
    try {
      set(state => ({ loading: { ...state.loading, vocabulary: true } }));
      const result = await axiosClient.post('/admin/lesson-vocabulary', { lesson_id: lessonId, ...vocabData });
      
      // Refresh vocabulary, lessons, and statistics
      await Promise.all([
        get().fetchLessonVocabulary(lessonId, 1, 10, true),
        get().fetchLessons(true),
        get().fetchStatistics(true)  // Refresh statistics for vocabulary count
      ]);
      
      return result;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set(state => ({ loading: { ...state.loading, vocabulary: false } }));
    }
  },

  updateLessonVocabulary: async (lessonId, vocabId, vocabData) => {
    try {
      set(state => ({ loading: { ...state.loading, vocabulary: true } }));
      const result = await axiosClient.put(`/admin/lesson-vocabulary/${lessonId}/${vocabId}`, vocabData);
      
      // FIX: Update local state immediately + force refresh from server
      const state = get();
      const currentData = state.lessonVocabulary[lessonId];
      
      if (currentData && currentData.vocabulary) {
        // Update the specific vocabulary item in local state immediately
        const updatedVocabulary = currentData.vocabulary.map(vocab => {
          if (vocab.vocab_id === vocabId) {
            return { ...vocab, ...vocabData };
          }
          return vocab;
        });
        
        // Update local state immediately for instant UI feedback
        set(state => ({
          lessonVocabulary: {
            ...state.lessonVocabulary,
            [lessonId]: {
              ...currentData,
              vocabulary: updatedVocabulary
            }
          }
        }));
      }
      
      // Then refresh from server to ensure data consistency
      const currentPage = currentData?.pagination?.current_page || 1;
      await Promise.all([
        get().fetchLessonVocabulary(lessonId, currentPage, 10, true),
        get().fetchStatistics(true)
      ]);
      
      return result;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set(state => ({ loading: { ...state.loading, vocabulary: false } }));
    }
  },

  removeLessonVocabulary: async (lessonId, vocabId) => {
    try {
      const result = await axiosClient.delete(`/admin/lesson-vocabulary/${lessonId}/${vocabId}`);
      const state = get();
      const currentData = state.lessonVocabulary[lessonId];
      const currentPage = currentData?.pagination?.current_page || 1;
      
      // Refresh vocabulary, lessons, and statistics
      await Promise.all([
        get().fetchLessonVocabulary(lessonId, currentPage, 10, true), 
        get().fetchLessons(true),
        get().fetchStatistics(true)  // Refresh statistics for vocabulary count
      ]);
      
      return result;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  loadVocabularyPage: async (lessonId, page) => {
    await get().fetchLessonVocabulary(lessonId, page, 10, true);
  },

  fetchStatistics: async (force = false) => {
    const state = get();
    if (!force && state.dataFetched.statistics) return;
    console.log('Fetching statistics...');
    set(state => ({ loading: { ...state.loading, statistics: true }, error: null }));
    try {
      const result = await axiosClient.get('/admin/statistics');
      console.log('Statistics API Response:', result);
      set({ statistics: result.data, dataFetched: { ...state.dataFetched, statistics: true } });
    } catch (error) {
      console.error('Fetch statistics error:', error);
      set({ error: error.message });
    } finally {
      set(state => ({ loading: { ...state.loading, statistics: false } }));
    }
  },

  uploadAudio: async (audioData, filename) => {
    set(state => ({ loading: { ...state.loading, uploading: true } }));
    try {
      console.log('Uploading audio to server...');
      const result = await axiosClient.post('/admin/upload-audio', { audio_data: audioData, filename });
      console.log('Upload result:', result);
      return result.data;
    } catch (error) {
      console.error('Upload audio error:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set(state => ({ loading: { ...state.loading, uploading: false } }));
    }
  },

  searchExistingVocabulary: async (keyword, page = 1, limit = 10) => {
    try {
      set(state => ({ loading: { ...state.loading, vocabulary: true } }));
      const result = await axiosClient.get(`/admin/search-vocabulary?keyword=${encodeURIComponent(keyword)}&page=${page}&limit=${limit}`);
      return result.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set(state => ({ loading: { ...state.loading, vocabulary: false } }));
    }
  },

  addExistingVocabularyToLesson: async (lessonId, vocabId) => {
    try {
      set(state => ({ loading: { ...state.loading, vocabulary: true } }));
      const result = await axiosClient.post('/admin/add-existing-vocabulary', { 
        lesson_id: lessonId, 
        vocab_id: vocabId 
      });
      
      // Refresh lesson vocabulary after adding
      await get().fetchLessonVocabulary(lessonId, 1, 10, true);
      await get().fetchLessons(true);
      await get().fetchStatistics(true);
      
      return result;
    } catch (error) {
      set({ error: error.message });
      throw error;
    } finally {
      set(state => ({ loading: { ...state.loading, vocabulary: false } }));
    }
  },

  getCurrentLessonVocabulary: () => {
    const state = get();
    if (!state.selectedLessonId) return null;
    return state.lessonVocabulary[state.selectedLessonId];
  },

  getLessonById: (lessonId) => {
    const state = get();
    return state.lessons.find(lesson => lesson.lesson_id === lessonId);
  },

  getTopicById: (topicId) => {
    const state = get();
    return state.topics.find(topic => topic.topic_id === topicId);
  },

  clearError: () => set({ error: null }),

  reset: () => set({
    topics: [],
    lessons: [],
    lessonVocabulary: {},
    statistics: null,
    selectedTopicId: null,
    selectedLessonId: null,
    selectedItems: { topics: [], lessons: [], vocabulary: [] },
    dataFetched: { topics: false, lessons: false, statistics: false },
    loading: { topics: false, lessons: false, vocabulary: false, statistics: false, uploading: false, initializing: false },
    error: null,
    searchKeyword: ''
  })
}));

export default useAdminStore;