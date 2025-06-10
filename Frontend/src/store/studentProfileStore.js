import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

const useStudentProfileStore = create((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,
  uploadProgress: 0,
  isUploading: false,
  uploadError: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get('/student-profile');
      if (response && response.data) {
        let profileData = null;
        if (response.data.status === 200 && response.data.data) {
          profileData = response.data.data;
        } else if (response.data.status === 404) {
          set({ profile: null, isLoading: false, error: null });
          return null;
        } else if (response.data.profile_id) {
          profileData = response.data;
        } else if (response.status === 200 && !response.data.data) {
          set({ profile: null, isLoading: false, error: null });
          return null;
        }
        set({ profile: profileData, isLoading: false, error: null });
        return profileData;
      } else {
        set({ profile: null, isLoading: false, error: null });
        return null;
      }
    } catch (error) {
      console.log('Profile fetch info:', error);
      if (error.response && error.response.status === 404) {
        set({ profile: null, isLoading: false, error: null });
        return null;
      }
      if (error.response && error.response.status === 401) {
        set({ profile: null, isLoading: false, error: null });
        return null;
      }
      if (error.response && error.response.status >= 500) {
        let errorMessage = 'Lỗi server khi tải profile';
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        set({ error: errorMessage, isLoading: false, profile: null });
        console.error('Server error loading profile:', errorMessage);
        return null;
      }
      set({ profile: null, isLoading: false, error: null });
      return null;
    }
  },

  createOrUpdateProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    try {
      // Kiểm tra xem có profile hay chưa để validate tương ứng
      const currentProfile = get().profile;
      const isUpdate = currentProfile && currentProfile.profile_id;
      
      const validation = get().validateProfileData(profileData, isUpdate);
      if (!validation.valid) {
        throw new Error('Dữ liệu không hợp lệ: ' + validation.errors.join(', '));
      }
      
      const response = await axiosClient.post('/student-profile', profileData);
      console.log('Create/Update profile response:', response);
      
      if (response && response.data) {
        let updatedProfile = null;
        let message = 'Cập nhật profile thành công';
        let isComplete = false;
        
        if (response.data.status === 200 || response.data.status === 201) {
          updatedProfile = response.data.data;
          message = response.data.message || message;
          isComplete = response.data.data?.is_complete || false;
        } else if (response.data.profile_id || response.data.user_id) {
          updatedProfile = response.data;
          isComplete = response.data.is_complete || false;
        } else if (response.status === 200 && response.data) {
          updatedProfile = response.data;
          isComplete = response.data.is_complete || false;
        }
        
        set({ profile: updatedProfile, isLoading: false, error: null });
        return { 
          success: true, 
          message: message, 
          data: updatedProfile,
          is_complete: isComplete 
        };
      } else {
        console.log('No response data, assuming success');
        set({ isLoading: false, error: null });
        return { success: true, message: 'Cập nhật profile thành công', data: null, is_complete: false };
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      let errorMessage = 'Không thể cập nhật profile';
      if (error.response && error.response.data) {
        if (error.response.data.errors) {
          // Handle validation errors from server
          const serverErrors = Object.values(error.response.data.errors).join(', ');
          errorMessage = `Dữ liệu không hợp lệ: ${serverErrors}`;
        } else {
          errorMessage = error.response.data.message || errorMessage;
        }
        console.log('Server response:', error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.put('/student-profile', profileData);
      if (response && response.data) {
        let updatedProfile = null;
        let isComplete = false;
        if (response.data.status === 200) {
          updatedProfile = response.data.data;
          isComplete = response.data.data?.is_complete || false;
        } else if (response.data.profile_id) {
          updatedProfile = response.data;
          isComplete = response.data.is_complete || false;
        }
        set({ profile: updatedProfile, isLoading: false, error: null });
        return { 
          success: true, 
          message: response.data.message || 'Cập nhật profile thành công', 
          data: updatedProfile,
          is_complete: isComplete
        };
      } else {
        throw new Error('Không có dữ liệu trả về từ API');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      let errorMessage = 'Không thể cập nhật profile';
      if (error.response && error.response.data) {
        if (error.response.data.errors) {
          const serverErrors = Object.values(error.response.data.errors).join(', ');
          errorMessage = `Dữ liệu không hợp lệ: ${serverErrors}`;
        } else {
          errorMessage = error.response.data.message || errorMessage;
        }
      }
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  deleteProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.delete('/student-profile');
      console.log('Delete profile response:', response);
      
      // Handle different response structures
      if (response && response.status === 200) {
        let message = 'Xóa toàn bộ thông tin cá nhân thành công';
        
        // Try to get message from response data if available
        if (response.data && response.data.message) {
          message = response.data.message;
        } else if (response.data && typeof response.data === 'string') {
          message = response.data;
        }
        
        set({ profile: null, isLoading: false, error: null });
        return { success: true, message: message };
      } else if (response && response.data && response.data.status === 200) {
        set({ profile: null, isLoading: false, error: null });
        return { success: true, message: response.data.message || 'Xóa toàn bộ thông tin cá nhân thành công' };
      } else {
        throw new Error('Không thể xóa thông tin cá nhân');
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      let errorMessage = 'Không thể xóa thông tin cá nhân';
      
      if (error.response) {
        console.log('Error response:', error.response);
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data && typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.statusText) {
          errorMessage = `Lỗi ${error.response.status}: ${error.response.statusText}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  uploadProfilePicture: async (file) => {
    set({ isUploading: true, uploadProgress: 0, uploadError: null });
    try {
      const fileValidation = get().validateImageFile(file);
      if (!fileValidation.valid) {
        throw new Error('File không hợp lệ: ' + fileValidation.errors.join(', '));
      }
      const formData = new FormData();
      formData.append('profile_picture', file);
      const response = await axiosClient.post('/upload-profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          set({ uploadProgress: progress });
        },
      });
      if (response && response.data) {
        let uploadResult = null;
        if (response.data.status === 200) {
          uploadResult = response.data.data;
        } else if (response.data.url) {
          uploadResult = response.data;
        }
        const currentProfile = get().profile;
        if (currentProfile && uploadResult) {
          set({ profile: { ...currentProfile, profile_picture: uploadResult.url } });
        }
        set({ isUploading: false, uploadProgress: 100, uploadError: null });
        return { success: true, message: response.data.message || 'Upload ảnh thành công', data: uploadResult };
      } else {
        throw new Error('Không có dữ liệu trả về từ API');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      let errorMessage = 'Không thể upload ảnh';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      }
      set({ isUploading: false, uploadProgress: 0, uploadError: errorMessage });
      throw new Error(errorMessage);
    }
  },

  // NEW: API call để kiểm tra tính hoàn thiện từ server
  checkProfileCompleteness: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get('/student-profile-completeness');
      if (response && response.data) {
        const result = {
          is_complete: response.data.is_complete || false,
          missing_fields: response.data.missing_fields || [],
          status: response.data.status
        };
        set({ isLoading: false, error: null });
        return result;
      } else {
        throw new Error('Không có dữ liệu trả về từ API');
      }
    } catch (error) {
      console.error('Error checking profile completeness:', error);
      let errorMessage = 'Không thể kiểm tra tính hoàn thiện profile';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      }
      set({ error: errorMessage, isLoading: false });
      return { is_complete: false, missing_fields: [], error: errorMessage };
    }
  },

  // NEW: Option 3 - Kết hợp client-side check + API verification
  checkDiaryAccess: async () => {
    try {
      // Step 1: Quick client-side check for better UX
      const quickCheck = get().hasCompleteProfile();
      
      if (!quickCheck) {
        const missing = get().getMissingFields();
        return {
          success: false,
          can_access_diary: false,
          message: `Vui lòng hoàn thiện: ${missing.join(', ')}`,
          missing_fields: missing,
          source: 'client'
        };
      }
      
      // Step 2: API verification for accuracy
      const serverCheck = await get().checkProfileCompleteness();
      
      if (serverCheck.is_complete) {
        return {
          success: true,
          can_access_diary: true,
          message: 'Profile đã hoàn thiện, có thể sử dụng sổ tay',
          missing_fields: [],
          source: 'server'
        };
      } else {
        const missing = serverCheck.missing_fields.map(field => {
          const fieldMap = {
            'full_name': 'họ và tên',
            'birth_date': 'ngày sinh',
            'address': 'địa chỉ'
          };
          return fieldMap[field] || field;
        });
        
        return {
          success: false,
          can_access_diary: false,
          message: `Vui lòng hoàn thiện: ${missing.join(', ')}`,
          missing_fields: missing,
          source: 'server'
        };
      }
    } catch (error) {
      console.error('Error checking diary access:', error);
      
      // Fallback to client-side check if API fails
      const clientCheck = get().hasCompleteProfile();
      const missing = get().getMissingFields();
      
      return {
        success: false,
        can_access_diary: clientCheck,
        message: clientCheck 
          ? 'Không thể xác minh từ server, nhưng profile có vẻ đã hoàn thiện'
          : `Vui lòng hoàn thiện: ${missing.join(', ')}`,
        missing_fields: missing,
        source: 'client_fallback',
        error: error.message
      };
    }
  },

  // Validation với context khác nhau cho create vs update
  validateProfileData: (data, isUpdate = false) => {
    const errors = [];
    
    // Validate full_name - Logic khác nhau cho create vs update
    if (isUpdate) {
      // Khi update: bắt buộc phải có full_name nếu gửi lên
      if (data.hasOwnProperty('full_name')) {
        if (!data.full_name || data.full_name.trim().length === 0) {
          errors.push('Họ và tên không được để trống');
        } else if (data.full_name.trim().length < 2) {
          errors.push('Họ và tên phải có ít nhất 2 ký tự');
        } else if (data.full_name.length > 100) {
          errors.push('Họ và tên không được quá 100 ký tự');
        } else if (!/^[a-zA-ZÀ-ỹ\s]+$/u.test(data.full_name)) {
          errors.push('Họ và tên chỉ được chứa chữ cái và khoảng trắng');
        }
      }
    } else {
      // Khi create: cho phép empty để tạo skeleton profile
      if (data.full_name && data.full_name.trim().length > 0) {
        if (data.full_name.trim().length < 2) {
          errors.push('Họ và tên phải có ít nhất 2 ký tự');
        } else if (data.full_name.length > 100) {
          errors.push('Họ và tên không được quá 100 ký tự');
        } else if (!/^[a-zA-ZÀ-ỹ\s]+$/u.test(data.full_name)) {
          errors.push('Họ và tên chỉ được chứa chữ cái và khoảng trắng');
        }
      }
    }
    
    // Validate birth_date
    if (data.hasOwnProperty('birth_date') && data.birth_date) {
      const birthDate = new Date(data.birth_date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (isNaN(birthDate.getTime())) {
        errors.push('Ngày sinh không hợp lệ');
      } else if (birthDate > today) {
        errors.push('Ngày sinh không thể là tương lai');
      } else if (age < 5) {
        errors.push('Tuổi phải từ 5 tuổi trở lên');
      } else if (age > 120) {
        errors.push('Tuổi không được quá 120 tuổi');
      }
    }
    
    // Validate address
    if (data.hasOwnProperty('address') && data.address && data.address.length > 255) {
      errors.push('Địa chỉ không được quá 255 ký tự');
    }
    
    // Validate bio
    if (data.hasOwnProperty('bio') && data.bio && data.bio.length > 500) {
      errors.push('Giới thiệu bản thân không được quá 500 ký tự');
    }
    
    return { valid: errors.length === 0, errors: errors };
  },

  validateImageFile: (file) => {
    const errors = [];
    const maxSizeMB = 5;
    const allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!file) {
      errors.push('Không có file nào được chọn');
      return { valid: false, errors };
    }
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      errors.push(`File quá lớn. Kích thước tối đa là ${maxSizeMB}MB`);
    }
    if (file.size < 1024) {
      errors.push('File quá nhỏ. Kích thước tối thiểu là 1KB');
    }
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedFormats.includes(fileExtension)) {
      errors.push(`Định dạng file không được hỗ trợ. Chỉ chấp nhận: ${allowedFormats.join(', ').toUpperCase()}`);
    }
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.type)) {
      errors.push(`Loại file không được hỗ trợ: ${file.type}`);
    }
    return { valid: errors.length === 0, errors: errors };
  },

  resetUploadState: () => {
    set({ uploadProgress: 0, isUploading: false, uploadError: null });
  },

  clearError: () => {
    set({ error: null, uploadError: null });
  },

  resetStore: () => {
    set({ profile: null, isLoading: false, error: null, uploadProgress: 0, isUploading: false, uploadError: null });
  },

  hasProfile: () => {
    const profile = get().profile;
    return profile && profile.profile_id;
  },

  // IMPROVED: Kiểm tra xem có thông tin đầy đủ chưa (client-side)
  hasCompleteProfile: () => {
    const profile = get().profile;
    if (!profile || !profile.profile_id) return false;
    
    // Kiểm tra các trường bắt buộc theo business logic mới
    const hasFullName = profile.full_name && profile.full_name.trim().length > 0;
    const hasBirthDate = profile.birth_date && profile.birth_date.trim().length > 0;
    const hasAddress = profile.address && profile.address.trim().length > 0;
    
    return hasFullName && hasBirthDate && hasAddress;
  },

  // NEW: Lấy danh sách các trường còn thiếu (client-side)
  getMissingFields: () => {
    const profile = get().profile;
    if (!profile || !profile.profile_id) return ['profile'];
    
    const missing = [];
    if (!profile.full_name || profile.full_name.trim().length === 0) {
      missing.push('họ và tên');
    }
    if (!profile.birth_date || profile.birth_date.trim().length === 0) {
      missing.push('ngày sinh');
    }
    if (!profile.address || profile.address.trim().length === 0) {
      missing.push('địa chỉ');
    }
    
    return missing;
  },

  calculateAge: () => {
    const profile = get().profile;
    if (!profile || !profile.birth_date) return null;
    const birthDate = new Date(profile.birth_date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  }
}));

export default useStudentProfileStore;  