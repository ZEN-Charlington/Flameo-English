import React, { useState, useEffect, useRef } from 'react';
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
  useToast,
  useColorModeValue,
  HStack,
  IconButton
} from '@chakra-ui/react';
import { CalendarIcon } from '@chakra-ui/icons';
import useAuthStore from '../store/authStore';
import {
  formatDateInput,
  convertToISODate,
  formatToDDMMYYYY,
  formatToNativeDate
} from '../utils/dateHelpers';

const UserSettingsModal = ({ isOpen, onClose }) => {
  const { user, updateUserProfile } = useAuthStore();
  const toast = useToast();
  const readOnlyBg = useColorModeValue('gray.100', 'gray.600');
  const hiddenDateRef = useRef(null);

  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    full_name: '',
    birth_date: '',
    address: '',
    profile_picture: ''
  });

  const [tempDate, setTempDate] = useState('');

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
      setTempDate(user.birth_date ? formatToDDMMYYYY(user.birth_date) : '');
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profile_picture: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTextDateChange = (e) => {
    const formatted = formatDateInput(e.target.value);
    setTempDate(formatted);

    if (formatted.length === 10) {
      const iso = convertToISODate(formatted);
      if (iso) {
        setFormData({ ...formData, birth_date: iso });
      }
    }
  };

  const handleDatePick = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, birth_date: value });
    setTempDate(formatToDDMMYYYY(value));
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
              onChange={handleImageChange}
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
              bg={readOnlyBg}
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
            <HStack>
              <Input
                type="text"
                placeholder="dd/mm/yyyy"
                value={tempDate}
                onChange={handleTextDateChange}
              />
              <IconButton
                icon={<CalendarIcon />}
                onClick={() => hiddenDateRef.current?.showPicker()}
                aria-label="Chọn ngày"
              />
              <Input
                type="date"
                ref={hiddenDateRef}
                onChange={handleDatePick}
                value={formData.birth_date}
                display="none"
              />
            </HStack>
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
