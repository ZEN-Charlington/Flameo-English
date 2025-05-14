import React, { useState } from 'react';
import {
  Box,
  Flex,
  Container,
  Heading,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  InputGroup,
  InputRightElement,
  VStack,
  Link as ChakraLink,
  useColorModeValue,
  useToast,
  FormErrorMessage,
  Image
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import flameoLogo from '../assets/AppAvatar.png'; 

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    display_name: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  
  const bgGradient = useColorModeValue(
    'linear(to-b, blue.50, gray.50)',
    'linear(to-b, gray.900, gray.800)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Xóa lỗi khi người dùng sửa
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Kiểm tra email
    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    // Kiểm tra mật khẩu
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    // Kiểm tra xác nhận mật khẩu
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    
    // Kiểm tra tên hiển thị
    if (!formData.display_name) {
      newErrors.display_name = 'Tên hiển thị là bắt buộc';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const response = await register({
        email: formData.email,
        password: formData.password,
        display_name: formData.display_name
      });
      
      toast({
        title: 'Đăng ký thành công',
        description: 'Bạn có thể đăng nhập ngay bây giờ.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      navigate('/login');
    } catch (error) {
      toast({
        title: 'Đăng ký thất bại',
        description: error.message || 'Đã xảy ra lỗi khi đăng ký tài khoản.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  return (
    <Box 
      minH="100vh" 
      bgGradient={bgGradient}
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={10}
    >
      <Container maxW="lg">
        <VStack spacing={8} align="center">
          <Image src={flameoLogo} alt="Flameo" h="80px" />
          
          <Box
            w="full"
            bg={cardBg}
            p={8}
            borderRadius="lg"
            boxShadow="lg"
          >
            <VStack spacing={6}>
              <Heading
                size="xl"
                bgGradient="linear(to-r, blue.400, purple.500)"
                bgClip="text"
                textAlign="center"
              >
                Đăng ký tài khoản
              </Heading>
              
              <Text color="gray.500" textAlign="center">
                Tạo tài khoản để bắt đầu học tiếng Anh cùng Flameo
              </Text>
              
              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <VStack spacing={4} align="stretch">
                  <FormControl isInvalid={errors.email}>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                    <FormErrorMessage>{errors.email}</FormErrorMessage>
                  </FormControl>
                  
                  <FormControl isInvalid={errors.display_name}>
                    <FormLabel>Tên hiển thị</FormLabel>
                    <Input
                      type="text"
                      name="display_name"
                      placeholder="Nhập tên hiển thị của bạn"
                      value={formData.display_name}
                      onChange={handleChange}
                    />
                    <FormErrorMessage>{errors.display_name}</FormErrorMessage>
                  </FormControl>
                  
                  <FormControl isInvalid={errors.password}>
                    <FormLabel>Mật khẩu</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                      />
                      <InputRightElement>
                        <Button
                          variant="ghost"
                          onClick={() => setShowPassword(!showPassword)}
                          size="sm"
                        >
                          {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>{errors.password}</FormErrorMessage>
                  </FormControl>
                  
                  <FormControl isInvalid={errors.confirmPassword}>
                    <FormLabel>Xác nhận mật khẩu</FormLabel>
                    <InputGroup>
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                      />
                      <InputRightElement>
                        <Button
                          variant="ghost"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          size="sm"
                        >
                          {showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                    <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                  </FormControl>
                  
                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    w="full"
                    isLoading={isLoading}
                    mt={4}
                    bgGradient="linear(to-r, blue.400, purple.500)"
                    _hover={{
                      bgGradient: "linear(to-r, blue.500, purple.600)"
                    }}
                  >
                    Đăng ký
                  </Button>
                </VStack>
              </form>
            </VStack>
          </Box>
          
          <Text>
            Đã có tài khoản?{' '}
            <ChakraLink as={Link} to="/login" color="blue.500" fontWeight="bold">
              Đăng nhập
            </ChakraLink>
          </Text>
        </VStack>
      </Container>
    </Box>
  );
};

export default RegisterPage;