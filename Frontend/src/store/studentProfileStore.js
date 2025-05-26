// src/store/studentProfileStore.js
import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

const useStudentProfileStore = create((set, get) => ({
  // === STATE ===
  profile: null, // Thông tin profile hiện tại
  isLoading: false,
  error: null,
  
  // State cho upload ảnh
  uploadProgress: 0,
  isUploading: false,
  uploadError: null,

  // === PROFILE METHODS ===
  
  // Lấy thông tin profile
  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.get('/student-profile');
      
      if (response && response.data) {
        let profileData = null;
        if (response.data.status === 200 && response.data.data) {
          profileData = response.data.data;
        } else if (response.data.status === 404) {
          set({ 
            profile: null,
            isLoading: false,
            error: null
          });
          return null;
        } else if (response.data.profile_id) {
          // Response trực tiếp là profile data
          profileData = response.data;
        } else if (response.status === 200 && !response.data.data) {
          // Response có status 200 nhưng không có data - chưa có profile
          set({ 
            profile: null,
            isLoading: false,
            error: null
          });
          return null;
        }
        
        set({ 
          profile: profileData,
          isLoading: false,
          error: null
        });
        
        return profileData;
      } else {
        // Không có response data - có thể là chưa có profile hoặc lỗi server
        // Không ném lỗi, chỉ trả về null
        set({ 
          profile: null,
          isLoading: false,
          error: null
        });
        return null;
      }
    } catch (error) {
      console.log('Profile fetch info:', error); 
      if (error.response && error.response.status === 404) {
        set({ 
          profile: null,
          isLoading: false,
          error: null
        });
        return null;
      }
      
      // Nếu là 401 - chưa đăng nhập (không phải lỗi nghiêm trọng)
      if (error.response && error.response.status === 401) {
        set({ 
          profile: null,
          isLoading: false,
          error: null
        });
        return null;
      }
      
      // Chỉ báo lỗi với các lỗi server thật sự (5xx)
      if (error.response && error.response.status >= 500) {
        let errorMessage = 'Lỗi server khi tải profile';
        
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        
        set({ 
          error: errorMessage,
          isLoading: false,
          profile: null
        });
        
        console.error('Server error loading profile:', errorMessage);
        return null;
      }
      
      // Các lỗi khác - không báo lỗi, chỉ trả về null
      set({ 
        profile: null,
        isLoading: false,
        error: null
      });
      
      return null;
    }
  },

  // Tạo hoặc cập nhật profile
  createOrUpdateProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    try {
      // Validate dữ liệu trước khi gửi
      const validation = get().validateProfileData(profileData);
      if (!validation.valid) {
        throw new Error('Dữ liệu không hợp lệ: ' + validation.errors.join(', '));
      }

      const response = await axiosClient.post('/student-profile', profileData);
      
      console.log('Create/Update profile response:', response); // Debug log
      
      if (response && response.data) {
        let updatedProfile = null;
        let message = 'Cập nhật profile thành công';
        
        // Xử lý các format response khác nhau
        if (response.data.status === 200 || response.data.status === 201) {
          updatedProfile = response.data.data;
          message = response.data.message || message;
        } else if (response.data.profile_id || response.data.user_id) {
          // Response trực tiếp là profile data
          updatedProfile = response.data;
        } else if (response.status === 200 && response.data) {
          // Response có status 200, coi như thành công
          updatedProfile = response.data;
        }
        
        set({ 
          profile: updatedProfile,
          isLoading: false,
          error: null
        });
        
        return {
          success: true,
          message: message,
          data: updatedProfile
        };
      } else {
        // Không có response data nhưng có thể vẫn thành công
        console.log('No response data, but request might be successful');
        
        // Thử fetch lại profile để xem có cập nhật không
        const updatedProfile = await get().fetchProfile();
        
        set({ 
          profile: updatedProfile,
          isLoading: false,
          error: null
        });
        
        return {
          success: true,
          message: 'Cập nhật profile thành công',
          data: updatedProfile
        };
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      
      let errorMessage = 'Không thể cập nhật profile';
      let errorDetails = [];
      
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
        errorDetails = error.response.data.errors || [];
        
        // Log chi tiết để debug
        console.log('Server response:', error.response.data);
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      set({ 
        error: errorMessage,
        isLoading: false
      });
      
      throw new Error(errorMessage);
    }
  },

  // Cập nhật profile (PUT method)
  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.put('/student-profile', profileData);
      
      if (response && response.data) {
        let updatedProfile = null;
        
        if (response.data.status === 200) {
          updatedProfile = response.data.data;
        } else if (response.data.profile_id) {
          updatedProfile = response.data;
        }
        
        set({ 
          profile: updatedProfile,
          isLoading: false,
          error: null
        });
        
        return {
          success: true,
          message: response.data.message || 'Cập nhật profile thành công',
          data: updatedProfile
        };
      } else {
        throw new Error('Không có dữ liệu trả về từ API');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      
      let errorMessage = 'Không thể cập nhật profile';
      
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      }
      
      set({ 
        error: errorMessage,
        isLoading: false
      });
      
      throw new Error(errorMessage);
    }
  },

  // Xóa profile
  deleteProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosClient.delete('/student-profile');
      
      if (response && (response.status === 200 || response.data.status === 200)) {
        set({ 
          profile: null,
          isLoading: false,
          error: null
        });
        
        return {
          success: true,
          message: response.data.message || 'Xóa profile thành công'
        };
      } else {
        throw new Error('Không thể xóa profile');
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
      
      let errorMessage = 'Không thể xóa profile';
      
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      }
      
      set({ 
        error: errorMessage,
        isLoading: false
      });
      
      throw new Error(errorMessage);
    }
  },

  // === IMAGE UPLOAD METHODS ===
  
  // Upload ảnh profile
  uploadProfilePicture: async (file) => {
    set({ 
      isUploading: true, 
      uploadProgress: 0, 
      uploadError: null 
    });
    
    try {
      // Validate file trước khi upload
      const fileValidation = get().validateImageFile(file);
      if (!fileValidation.valid) {
        throw new Error('File không hợp lệ: ' + fileValidation.errors.join(', '));
      }

      const formData = new FormData();
      formData.append('profile_picture', file);

      const response = await axiosClient.post('/upload-profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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
        
        // Cập nhật profile với ảnh mới
        const currentProfile = get().profile;
        if (currentProfile && uploadResult) {
          set({
            profile: {
              ...currentProfile,
              profile_picture: uploadResult.url
            }
          });
        }
        
        set({ 
          isUploading: false,
          uploadProgress: 100,
          uploadError: null
        });
        
        return {
          success: true,
          message: response.data.message || 'Upload ảnh thành công',
          data: uploadResult
        };
      } else {
        throw new Error('Không có dữ liệu trả về từ API');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      
      let errorMessage = 'Không thể upload ảnh';
      let errorDetails = [];
      
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
        errorDetails = error.response.data.errors || [];
      }
      
      set({ 
        isUploading: false,
        uploadProgress: 0,
        uploadError: errorMessage
      });
      
      throw new Error(errorMessage);
    }
  },

  // === VALIDATION METHODS ===
  
  // Validate dữ liệu profile
  validateProfileData: (data) => {
    const errors = [];
    
    // Validate full_name
    if (!data.full_name || data.full_name.trim().length === 0) {
      errors.push('Họ và tên không được để trống');
    } else if (data.full_name.trim().length < 2) {
      errors.push('Họ và tên phải có ít nhất 2 ký tự');
    } else if (data.full_name.length > 100) {
      errors.push('Họ và tên không được quá 100 ký tự');
    } else if (!/^[a-zA-ZÀ-ỹ\s]+$/u.test(data.full_name)) {
      errors.push('Họ và tên chỉ được chứa chữ cái và khoảng trắng');
    }
    
    // Validate birth_date
    if (data.birth_date) {
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
    if (data.address && data.address.length > 255) {
      errors.push('Địa chỉ không được quá 255 ký tự');
    }
    
    // Validate bio
    if (data.bio && data.bio.length > 500) {
      errors.push('Giới thiệu bản thân không được quá 500 ký tự');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  },

  // Validate file ảnh
  validateImageFile: (file) => {
    const errors = [];
    const maxSizeMB = 5;
    const allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    if (!file) {
      errors.push('Không có file nào được chọn');
      return { valid: false, errors };
    }
    
    // Kiểm tra kích thước
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      errors.push(`File quá lớn. Kích thước tối đa là ${maxSizeMB}MB`);
    }
    
    if (file.size < 1024) {
      errors.push('File quá nhỏ. Kích thước tối thiểu là 1KB');
    }
    
    // Kiểm tra định dạng
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedFormats.includes(fileExtension)) {
      errors.push(`Định dạng file không được hỗ trợ. Chỉ chấp nhận: ${allowedFormats.join(', ').toUpperCase()}`);
    }
    
    // Kiểm tra MIME type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (!allowedMimeTypes.includes(file.type)) {
      errors.push(`Loại file không được hỗ trợ: ${file.type}`);
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  },

  // === UTILITY METHODS ===
  
  // Reset upload state
  resetUploadState: () => {
    set({
      uploadProgress: 0,
      isUploading: false,
      uploadError: null
    });
  },

  // Clear errors
  clearError: () => {
    set({ error: null, uploadError: null });
  },

  // Reset toàn bộ store
  resetStore: () => {
    set({
      profile: null,
      isLoading: false,
      error: null,
      uploadProgress: 0,
      isUploading: false,
      uploadError: null
    });
  },

  // Kiểm tra xem có profile không
  hasProfile: () => {
    const profile = get().profile;
    return profile && profile.profile_id;
  },

  // Tính tuổi từ birth_date
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