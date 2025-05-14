// Modal cài đặt tài khoản người dùng
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
  Avatar,
  Flex,
  Box,
  useToast
} from '@chakra-ui/react';
import useAuthStore from '../store/authStore';

const UserSettingsModal = ({ isOpen, onClose }) => {
  const { user, updateUserProfile } = useAuthStore();
  const toast = useToast();
  
  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    full_name: '',
    birth_date: '',
    address: '',
    profile_picture: ''
  });
  
  useEffect(() => {
    if (user) {
      setFormData({
        display_name: user.display_name || '',
        email: user.email || '',
        full_name: user.full_name || '',
        birth_date: user.birth_date || '',
        address: user.address || '',
        profile_picture: user.profile_picture || ''
      });
    }
  }, [user, isOpen]);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async () => {
    try {
      await updateUserProfile(formData);
      toast({
        title: 'Cập nhật thành công',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
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
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Cài đặt tài khoản</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Flex direction="column" align="center" mb={4}>
            <Avatar
              size="xl"
              name={formData.display_name}
              src={formData.profile_picture}
              mb={3}
            />
            <Input
              type="file"
              accept="image/*"
              display="none"
              id="profile-picture-upload"
            />
            <Button
              as="label"
              htmlFor="profile-picture-upload"
              size="sm"
              colorScheme="blue"
            >
              Thay đổi ảnh đại diện
            </Button>
          </Flex>
          
          <FormControl mb={3}>
            <FormLabel>Tên hiển thị</FormLabel>
            <Input
              name="display_name"
              value={formData.display_name}
              onChange={handleChange}
            />
          </FormControl>
          
          <FormControl mb={3}>
            <FormLabel>Email</FormLabel>
            <Input
              name="email"
              value={formData.email}
              onChange={handleChange}
              isReadOnly
              bg="gray.100"
            />
          </FormControl>
          
          <FormControl mb={3}>
            <FormLabel>Họ và tên</FormLabel>
            <Input
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
            />
          </FormControl>
          
          <FormControl mb={3}>
            <FormLabel>Ngày sinh</FormLabel>
            <Input
              name="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={handleChange}
            />
          </FormControl>
          
          <FormControl mb={3}>
            <FormLabel>Địa chỉ</FormLabel>
            <Input
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Hủy
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit}>
            Lưu thay đổi
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UserSettingsModal;