import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, 
  Button, FormControl, FormLabel, Input, Textarea, Avatar, Flex, useToast, useColorModeValue, 
  VStack, HStack, Text, Box, Divider, Alert, AlertIcon, AlertDescription, Tabs, TabList, 
  TabPanels, Tab, TabPanel, Badge, Image, AlertDialog, AlertDialogBody, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useDisclosure
} from '@chakra-ui/react';
import { FiUser, FiSettings, FiEdit3, FiTrash2 } from 'react-icons/fi';
import useAuthStore from '../store/authStore';
import useStudentProfileStore from '../store/studentProfileStore';
import ImageUrlUpload from './ImageUrlUpload';

const UserSettingsModal = ({ isOpen, onClose }) => {
  const { user, updateUserInfo, isLoading: userLoading } = useAuthStore();
  const { 
    profile, fetchProfile, createOrUpdateProfile, deleteProfile, isLoading: profileLoading, 
    error: profileError, hasProfile, hasCompleteProfile, calculateAge 
  } = useStudentProfileStore();
  
  const toast = useToast();
  const readOnlyBg = useColorModeValue('gray.100', 'gray.600');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bioColor = useColorModeValue('gray.600', 'gray.400');
  
  const [userFormData, setUserFormData] = useState({ display_name: '' });
  const [profileFormData, setProfileFormData] = useState({ full_name: '', birth_date: '', address: '', bio: '' });
  const [validationErrors, setValidationErrors] = useState({});
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  
  // Confirm delete dialog
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef();

  const loadProfileData = useCallback(async () => {
    if (!isOpen || profileLoaded) return;
    
    try {
      const profileData = await fetchProfile();
      if (profileData) {
        setProfileFormData({
          full_name: profileData.full_name || '',
          birth_date: profileData.birth_date || '',
          address: profileData.address || '',
          bio: profileData.bio || ''
        });
      } else {
        setProfileFormData({ full_name: '', birth_date: '', address: '', bio: '' });
      }
    } catch (error) {
      console.info('Profile not available:', error.message);
      setProfileFormData({ full_name: '', birth_date: '', address: '', bio: '' });
    } finally {
      setProfileLoaded(true);
    }
  }, [isOpen, profileLoaded, fetchProfile]);

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setUserFormData({ display_name: user.display_name || '' });
      }
      loadProfileData();
    } else {
      setProfileLoaded(false);
      setIsEditingImage(false);
      setUploadedImageUrl(null);
    }
  }, [isOpen, user, loadProfileData]);

  const handleUserChange = (e) => {
    setUserFormData({ ...userFormData, [e.target.name]: e.target.value });
  };

  const handleProfileChange = (e) => {
    setProfileFormData({ ...profileFormData, [e.target.name]: e.target.value });
    if (validationErrors[e.target.name]) {
      setValidationErrors({ ...validationErrors, [e.target.name]: null });
    }
  };

  const validateProfileForm = () => {
    const errors = {};
    const isUpdate = hasProfile();
    
    // Validation khác nhau cho create vs update
    if (isUpdate) {
      // Khi update: bắt buộc phải có full_name
      if (!profileFormData.full_name.trim()) {
        errors.full_name = 'Khi cập nhật, họ và tên không được để trống';
      } else if (profileFormData.full_name.trim().length < 2) {
        errors.full_name = 'Họ và tên phải có ít nhất 2 ký tự';
      } else if (profileFormData.full_name.length > 100) {
        errors.full_name = 'Họ và tên không được quá 100 ký tự';
      } else if (!/^[a-zA-ZÀ-ỹ\s]+$/u.test(profileFormData.full_name)) {
        errors.full_name = 'Họ và tên chỉ được chứa chữ cái và khoảng trắng';
      }
    } else {
      // Khi create: cho phép empty nhưng nếu có thì phải đúng format
      if (profileFormData.full_name && profileFormData.full_name.trim().length > 0) {
        if (profileFormData.full_name.trim().length < 2) {
          errors.full_name = 'Họ và tên phải có ít nhất 2 ký tự';
        } else if (profileFormData.full_name.length > 100) {
          errors.full_name = 'Họ và tên không được quá 100 ký tự';
        } else if (!/^[a-zA-ZÀ-ỹ\s]+$/u.test(profileFormData.full_name)) {
          errors.full_name = 'Họ và tên chỉ được chứa chữ cái và khoảng trắng';
        }
      }
    }
    
    // Validate birth_date (giống như cũ)
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
    
    // Validate address (giống như cũ)
    if (profileFormData.address && profileFormData.address.length > 255) {
      errors.address = 'Địa chỉ không được quá 255 ký tự';
    }
    
    // Validate bio (giống như cũ)
    if (profileFormData.bio && profileFormData.bio.length > 500) {
      errors.bio = 'Giới thiệu bản thân không được quá 500 ký tự';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUserSubmit = async () => {
    try {
      await updateUserInfo(userFormData);
      toast({ 
        title: 'Cập nhật thành công', 
        description: 'Tên hiển thị đã được cập nhật', 
        status: 'success', 
        duration: 3000, 
        isClosable: true 
      });
    } catch (error) {
      toast({ 
        title: 'Lỗi khi cập nhật', 
        description: error.message, 
        status: 'error', 
        duration: 3000, 
        isClosable: true 
      });
    }
  };

  const handleProfileSubmit = async () => {
    if (!validateProfileForm()) {
      toast({ 
        title: 'Dữ liệu không hợp lệ', 
        description: 'Vui lòng kiểm tra lại thông tin', 
        status: 'error', 
        duration: 3000, 
        isClosable: true 
      });
      return;
    }
    
    try {
      const submitData = { 
        ...profileFormData, 
        profile_picture: uploadedImageUrl || profile?.profile_picture || '' 
      };
      
      const result = await createOrUpdateProfile(submitData);
      
      toast({ 
        title: 'Cập nhật thành công', 
        description: 'Thông tin cá nhân đã được cập nhật', 
        status: 'success', 
        duration: 3000, 
        isClosable: true 
      });
      
      setIsEditingImage(false);
      setUploadedImageUrl(null);
      setProfileLoaded(false);
      
    } catch (error) {
      toast({ 
        title: 'Lỗi khi cập nhật', 
        description: error.message, 
        status: 'error', 
        duration: 3000, 
        isClosable: true 
      });
    }
  };

  const handleDeleteProfile = async () => {
    try {
      const result = await deleteProfile();
      
      if (result && result.success) {
        toast({ 
          title: 'Xóa thành công', 
          description: result.message || 'Đã xóa toàn bộ thông tin cá nhân', 
          status: 'success', 
          duration: 3000, 
          isClosable: true 
        });
        
        // Reset form data
        setProfileFormData({ full_name: '', birth_date: '', address: '', bio: '' });
        setUploadedImageUrl(null);
        setProfileLoaded(false);
        setValidationErrors({});
        onDeleteClose();
      } else {
        throw new Error('Xóa không thành công');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({ 
        title: 'Lỗi khi xóa', 
        description: error.message || 'Không thể xóa thông tin cá nhân', 
        status: 'error', 
        duration: 3000, 
        isClosable: true 
      });
    }
  };

  const handleImageUrlChange = (newUrl) => {
    setUploadedImageUrl(newUrl);
  };

  return (
    <>
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
                    {hasProfile() && !hasCompleteProfile() && <Badge ml={2} colorScheme="yellow" fontSize="xs">Chưa đầy đủ</Badge>}
                  </HStack>
                </Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    <Box p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                      <Text fontWeight="bold" mb={3}>Thông tin đăng nhập</Text>
                      <FormControl mb={3}>
                        <FormLabel>Email</FormLabel>
                        <Input value={user?.email || ''} isReadOnly bg={readOnlyBg} />
                        <Text fontSize="xs" color="gray.500" mt={1}>Email không thể thay đổi</Text>
                      </FormControl>
                      <FormControl mb={4}>
                        <FormLabel>Tên hiển thị (nickname)</FormLabel>
                        <Input 
                          name="display_name" 
                          value={userFormData.display_name} 
                          onChange={handleUserChange} 
                          placeholder="Nhập tên hiển thị..." 
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>Tên này sẽ hiển thị trên navbar và các nơi khác</Text>
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
                        <Text fontSize="sm"><strong>ID:</strong> {user?.user_id}</Text>
                        <Text fontSize="sm"><strong>Vai trò:</strong> {user?.role || 'student'}</Text>
                        <Text fontSize="sm">
                          <strong>Ngày tạo:</strong> {user?.created_at ? 
                            new Date(user.created_at).toLocaleDateString('vi-VN', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric' 
                            }) : 'N/A'
                          }
                        </Text>
                      </VStack>
                    </Box>
                  </VStack>
                </TabPanel>
                
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    {!hasProfile() && (
                      <Alert status="info" borderRadius="md">
                        <AlertIcon />
                        <AlertDescription>
                          Bạn chưa có thông tin cá nhân. Bạn có thể tạo profile cơ bản hoặc điền đầy đủ thông tin!
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {hasProfile() && !hasCompleteProfile() && (
                      <Alert status="warning" borderRadius="md">
                        <AlertIcon />
                        <AlertDescription>
                          Thông tin cá nhân chưa đầy đủ. Vui lòng cập nhật họ tên để hoàn thiện hồ sơ!
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <Box p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                      <Text fontWeight="bold" mb={3}>Ảnh đại diện</Text>
                      <ImageUrlUpload 
                        currentImageUrl={uploadedImageUrl || profile?.profile_picture || ''} 
                        onImageChange={handleImageUrlChange} 
                        placeholder="Paste URL ảnh từ internet (imgur, drive, etc)..." 
                      />
                    </Box>
                    
                    <Box p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                      <Flex justify="space-between" align="center" mb={3}>
                        <Text fontWeight="bold">Thông tin cá nhân</Text>
                        {hasProfile() && (
                          <Button 
                            leftIcon={<FiTrash2 />} 
                            colorScheme="red" 
                            variant="outline" 
                            size="sm"
                            onClick={onDeleteOpen}
                          >
                            Xóa toàn bộ
                          </Button>
                        )}
                      </Flex>
                      
                      <FormControl mb={3} isInvalid={validationErrors.full_name}>
                        <FormLabel>Họ và tên</FormLabel>
                        <Input 
                          name="full_name" 
                          value={profileFormData.full_name} 
                          onChange={handleProfileChange} 
                          placeholder="Nhập họ và tên ..." 
                        />
                        {validationErrors.full_name && (
                          <Text color="red.500" fontSize="sm" mt={1}>{validationErrors.full_name}</Text>
                        )}
                      </FormControl>
                      
                      <FormControl mb={3} isInvalid={validationErrors.birth_date}>
                        <FormLabel>
                          Ngày sinh
                          {calculateAge() && <Badge ml={2} colorScheme="blue" fontSize="xs">{calculateAge()} tuổi</Badge>}
                        </FormLabel>
                        <Input 
                          name="birth_date" 
                          type="date" 
                          value={profileFormData.birth_date} 
                          onChange={handleProfileChange} 
                        />
                        {validationErrors.birth_date && (
                          <Text color="red.500" fontSize="sm" mt={1}>{validationErrors.birth_date}</Text>
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
                          <Text color="red.500" fontSize="sm" mt={1}>{validationErrors.address}</Text>
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
                          <Text color="red.500" fontSize="sm" mt={1}>{validationErrors.bio}</Text>
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
                    
                    {hasProfile() && profile && (
                      <Box p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                        <Text fontWeight="bold" mb={3}>Tóm tắt hồ sơ</Text>
                        <Flex align="center" mb={3}>
                          <Avatar 
                            size="md" 
                            name={profile.full_name || 'Unknown'} 
                            src={profile.profile_picture} 
                            mr={3} 
                          />
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="medium">
                              {profile.full_name || <Text as="span" color="gray.500">Chưa có tên</Text>}
                            </Text>
                            {calculateAge() && <Text fontSize="sm" color={bioColor}>{calculateAge()} tuổi</Text>}
                          </VStack>
                        </Flex>
                        {profile.bio && <Text fontSize="md" color={bioColor}>{profile.bio}</Text>}
                      </Box>
                    )}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>Đóng</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirm Delete Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Xóa toàn bộ thông tin cá nhân
            </AlertDialogHeader>

            <AlertDialogBody>
              Bạn có chắc chắn muốn xóa toàn bộ thông tin cá nhân không? 
              Hành động này không thể hoàn tác.
              <br /><br />
              <Text fontWeight="medium">Thông tin sẽ bị xóa:</Text>
              <Text fontSize="sm" color="gray.600">
                • Họ và tên<br />
                • Ngày sinh<br />
                • Địa chỉ<br />
                • Ảnh đại diện<br />
                • Giới thiệu bản thân
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Hủy
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleDeleteProfile} 
                ml={3}
                isLoading={profileLoading}
              >
                Xóa toàn bộ
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default UserSettingsModal;