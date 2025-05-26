import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Avatar,
  Flex,
  useToast,
  useColorModeValue,
  VStack,
  HStack,
  Text,
  Box,
  Divider,
  Alert,
  AlertIcon,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Image
} from '@chakra-ui/react';
import { FiUser, FiSettings, FiEdit3 } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import useStudentProfileStore from '../store/studentProfileStore';
import ImageUrlUpload from './ImageUrlUpload';

const UserSettingsModal = ({ isOpen, onClose }) => {
  const { user, updateUserInfo, isLoading: userLoading } = useAuthStore();
  const { 
    profile, 
    fetchProfile, 
    createOrUpdateProfile, 
    isLoading: profileLoading,
    error: profileError,
    hasProfile,
    calculateAge
  } = useStudentProfileStore();
  
  const toast = useToast();
  const readOnlyBg = useColorModeValue('gray.100', 'gray.600');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bioColor = useColorModeValue('gray.600', 'gray.400');

  // State cho User info (Users table)
  const [userFormData, setUserFormData] = useState({
    display_name: ''
  });

  // State cho Student Profile (StudentProfiles table)
  const [profileFormData, setProfileFormData] = useState({
    full_name: '',
    birth_date: '',
    address: '',
    bio: ''
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null); // Track ảnh vừa upload

  // Load dữ liệu khi modal mở
  useEffect(() => {
    if (isOpen) {
      // Load user info
      if (user) {
        setUserFormData({
          display_name: user.display_name || ''
        });
      }

      // Load profile info
      fetchProfile().then((profileData) => {
        if (profileData) {
          let displayBirthDate = profileData.birth_date || '';
          if (displayBirthDate) {
            displayBirthDate = profileData.birth_date;
          }
          
          setProfileFormData({
            full_name: profileData.full_name || '',
            birth_date: displayBirthDate,
            address: profileData.address || '',
            bio: profileData.bio || ''
          });
        } else {
          setProfileFormData({
            full_name: '',
            birth_date: '',
            address: '',
            bio: ''
          });
        }
      }).catch((error) => {
        console.info('Profile not available:', error.message);
        setProfileFormData({
          full_name: '',
          birth_date: '',
          address: '',
          bio: ''
        });
      });
    }

    // Reset trạng thái edit khi mở/đóng modal
    setIsEditingImage(false);
    setUploadedImageUrl(null);
  }, [isOpen, user, fetchProfile]);

  // Handle User form changes
  const handleUserChange = (e) => {
    setUserFormData({ 
      ...userFormData, 
      [e.target.name]: e.target.value 
    });
  };

  // Handle Profile form changes
  const handleProfileChange = (e) => {
    setProfileFormData({ 
      ...profileFormData, 
      [e.target.name]: e.target.value 
    });
    
    // Clear validation error khi user sửa
    if (validationErrors[e.target.name]) {
      setValidationErrors({
        ...validationErrors,
        [e.target.name]: null
      });
    }
  };

  // Validate profile form
  const validateProfileForm = () => {
    const errors = {};

    // Validate full_name
    if (!profileFormData.full_name.trim()) {
      errors.full_name = 'Họ và tên không được để trống';
    } else if (profileFormData.full_name.trim().length < 2) {
      errors.full_name = 'Họ và tên phải có ít nhất 2 ký tự';
    } else if (profileFormData.full_name.length > 100) {
      errors.full_name = 'Họ và tên không được quá 100 ký tự';
    } else if (!/^[a-zA-ZÀ-ỹ\s]+$/u.test(profileFormData.full_name)) {
      errors.full_name = 'Họ và tên chỉ được chứa chữ cái và khoảng trắng';
    }

    // Validate birth_date
    if (profileFormData.birth_date) {
      const birthDate = new Date(profileFormData.birth_date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (isNaN(birthDate.getTime())) {
        errors.birth_date = 'Ngày sinh không hợp lệ';
      } else if (birthDate > today) {
        errors.birth_date = 'Ngày sinh không thể là tương lai';
      } else if (age < 5) {
        errors.birth_date = 'Tuổi phải từ 5 tuổi trở lên';
      } else if (age > 120) {
        errors.birth_date = 'Tuổi không được quá 120 tuổi';
      }
    }

    // Validate address
    if (profileFormData.address && profileFormData.address.length > 255) {
      errors.address = 'Địa chỉ không được quá 255 ký tự';
    }

    // Validate bio
    if (profileFormData.bio && profileFormData.bio.length > 500) {
      errors.bio = 'Giới thiệu bản thân không được quá 500 ký tự';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit User info
  const handleUserSubmit = async () => {
    try {
      await updateUserInfo(userFormData);
      toast({
        title: 'Cập nhật thành công',
        description: 'Tên hiển thị đã được cập nhật',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Lỗi khi cập nhật',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Submit Profile info
  const handleProfileSubmit = async () => {
    if (!validateProfileForm()) {
      toast({
        title: 'Dữ liệu không hợp lệ',
        description: 'Vui lòng kiểm tra lại thông tin',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Bao gồm ảnh hiện tại trong data submit
      const submitData = {
        ...profileFormData,
        profile_picture: uploadedImageUrl || profile?.profile_picture || ''
      };
      
      await createOrUpdateProfile(submitData);
      toast({
        title: 'Cập nhật thành công',
        description: 'Thông tin cá nhân đã được cập nhật',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      // Sau khi cập nhật thành công, tắt chế độ edit ảnh
      setIsEditingImage(false);
      // Reset uploaded image URL
      setUploadedImageUrl(null);
    } catch (error) {
      toast({
        title: 'Lỗi khi cập nhật',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle image URL change
  const handleImageUrlChange = (newUrl) => {
    setUploadedImageUrl(newUrl);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxH="85vh">
        <ModalHeader>Cài đặt tài khoản</ModalHeader>
        <ModalCloseButton />
        <ModalBody overflowY="auto">
          <Tabs variant="enclosed">
            <TabList>
              <Tab>
                <HStack spacing={2}>
                  <FiUser />
                  <Text>Thông tin tài khoản</Text>
                </HStack>
              </Tab>
              <Tab>
                <HStack spacing={2}>
                  <FiSettings />
                  <Text>Thông tin cá nhân</Text>
                  {!hasProfile() && <Badge ml={2} colorScheme="orange" fontSize="xs">Chưa có</Badge>}
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              {/* Tab 1: User Account Info */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Box p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                    <Text fontWeight="bold" mb={3}>Thông tin đăng nhập</Text>
                    
                    <FormControl mb={3}>
                      <FormLabel>Email</FormLabel>
                      <Input
                        value={user?.email || ''}
                        isReadOnly
                        bg={readOnlyBg}
                      />
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Email không thể thay đổi
                      </Text>
                    </FormControl>

                    <FormControl mb={4}>
                      <FormLabel>Tên hiển thị</FormLabel>
                      <Input
                        name="display_name"
                        value={userFormData.display_name}
                        onChange={handleUserChange}
                        placeholder="Nhập tên hiển thị..."
                      />
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Tên này sẽ hiển thị trên navbar và các nơi khác
                      </Text>
                    </FormControl>

                    <HStack justify="flex-end">
                      <Button
                        colorScheme="blue"
                        onClick={handleUserSubmit}
                        isLoading={userLoading}
                        size="sm"
                      >
                        Lưu thay đổi
                      </Button>
                    </HStack>
                  </Box>

                  <Box p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                    <Text fontWeight="bold" mb={3}>Thông tin hệ thống</Text>
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm">
                        <strong>ID:</strong> {user?.user_id}
                      </Text>
                      <Text fontSize="sm">
                        <strong>Vai trò:</strong> {user?.role || 'student'}
                      </Text>
                      <Text fontSize="sm">
                        <strong>Ngày tạo:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit', 
                          year: 'numeric'
                        }) : 'N/A'}
                      </Text>
                    </VStack>
                  </Box>
                </VStack>
              </TabPanel>

              {/* Tab 2: Student Profile */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {/* Profile Status */}
                  {!hasProfile() && (
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <AlertDescription>
                        Bạn chưa có thông tin cá nhân. Hãy điền thông tin để hoàn thiện hồ sơ!
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Profile Picture */}
                  <Box p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                    <Text fontWeight="bold" mb={3}>Ảnh đại diện</Text>
                    <ImageUrlUpload
                      currentImageUrl={uploadedImageUrl || profile?.profile_picture || ''}
                      onImageChange={handleImageUrlChange}
                      placeholder="Paste URL ảnh từ internet (imgur, drive, etc)..."
                    />
                  </Box>

                  {/* Personal Information */}
                  <Box p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                    <Text fontWeight="bold" mb={3}>Thông tin cá nhân</Text>

                    <FormControl mb={3} isInvalid={validationErrors.full_name}>
                      <FormLabel>Họ và tên *</FormLabel>
                      <Input
                        name="full_name"
                        value={profileFormData.full_name}
                        onChange={handleProfileChange}
                        placeholder="Nhập họ và tên đầy đủ..."
                      />
                      {validationErrors.full_name && (
                        <Text color="red.500" fontSize="sm" mt={1}>
                          {validationErrors.full_name}
                        </Text>
                      )}
                    </FormControl>

                    <FormControl mb={3} isInvalid={validationErrors.birth_date}>
                      <FormLabel>
                        Ngày sinh
                        {calculateAge() && (
                          <Badge ml={2} colorScheme="blue" fontSize="xs">
                            {calculateAge()} tuổi
                          </Badge>
                        )}
                      </FormLabel>
                      <Input
                        name="birth_date"
                        type="date"
                        value={profileFormData.birth_date}
                        onChange={handleProfileChange}
                      />
                      {validationErrors.birth_date && (
                        <Text color="red.500" fontSize="sm" mt={1}>
                          {validationErrors.birth_date}
                        </Text>
                      )}
                    </FormControl>

                    <FormControl mb={3} isInvalid={validationErrors.address}>
                      <FormLabel>Địa chỉ</FormLabel>
                      <Input
                        name="address"
                        value={profileFormData.address}
                        onChange={handleProfileChange}
                        placeholder="Nhập địa chỉ..."
                      />
                      {validationErrors.address && (
                        <Text color="red.500" fontSize="sm" mt={1}>
                          {validationErrors.address}
                        </Text>
                      )}
                    </FormControl>

                    <FormControl mb={4} isInvalid={validationErrors.bio}>
                      <FormLabel>
                        Giới thiệu bản thân
                        <Text as="span" fontSize="xs" color="gray.500" ml={2}>
                          ({profileFormData.bio.length}/500)
                        </Text>
                      </FormLabel>
                      <Textarea
                        name="bio"
                        value={profileFormData.bio}
                        onChange={handleProfileChange}
                        placeholder="Giới thiệu ngắn về bản thân..."
                        rows={3}
                        resize="vertical"
                      />
                      {validationErrors.bio && (
                        <Text color="red.500" fontSize="sm" mt={1}>
                          {validationErrors.bio}
                        </Text>
                      )}
                    </FormControl>

                    <HStack justify="flex-end">
                      <Button
                        colorScheme="blue"
                        onClick={handleProfileSubmit}
                        isLoading={profileLoading}
                      >
                        {hasProfile() ? 'Cập nhật thông tin' : 'Tạo thông tin cá nhân'}
                      </Button>
                    </HStack>
                  </Box>

                  {/* Profile Summary (if exists) */}
                  {hasProfile() && profile && (
                    <Box p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                      <Text fontWeight="bold" mb={3}>Tóm tắt hồ sơ</Text>
                      <Flex align="center" mb={3}>
                        <Avatar
                          size="md"
                          name={profile.full_name}
                          src={profile.profile_picture}
                          mr={3}
                        />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium">{profile.full_name}</Text>
                          {calculateAge() && (
                            <Text fontSize="sm" color={bioColor}>
                              {calculateAge()} tuổi
                            </Text>
                          )}
                        </VStack>
                      </Flex>
                      {profile.bio && (
                        <Text fontSize="md" color={bioColor}>
                          {profile.bio}
                        </Text>
                      )}
                    </Box>
                  )}
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UserSettingsModal;