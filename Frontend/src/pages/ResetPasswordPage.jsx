import React, { useState, useEffect } from 'react';
import {
  Box,
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
  Alert,
  AlertIcon,
  FormErrorMessage,
  Image
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import flameoLogo from '../assets/AppAvatar.png'; // Đường dẫn đến logo

const ResetPasswordPage = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(null);
  const [error, setError] = useState('');
  
  const { resetPassword, verifyResetToken, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  
  const bgGradient = useColorModeValue(
    'linear(to-b, blue.50, gray.50)',
    'linear(to-b, gray.900, gray.800)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  
  // Kiểm tra token khi trang được tải
  useEffect(() => {
    const checkToken = async () => {
      try {
        const result = await verifyResetToken(token);
        setIsTokenValid(result.valid);
      } catch (error) {
        setIsTokenValid(false);
        setError(error.message || 'Token không hợp lệ hoặc đã hết hạn');
      }
    };
    
    if (token) {
      checkToken();
    } else {
      setIsTokenValid(false);
      setError('Không tìm thấy token');
    }
  }, [token, verifyResetToken]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Kiểm tra mật khẩu
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    try {
      await resetPassword(token, password);
      
      toast({
        title: 'Đặt lại mật khẩu thành công',
        description: 'Bạn có thể đăng nhập với mật khẩu mới.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      navigate('/login');
    } catch (error) {
      setError(error.message || 'Đã xảy ra lỗi khi đặt lại mật khẩu');
      
      toast({
        title: 'Đặt lại mật khẩu thất bại',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Hiển thị trạng thái kiểm tra token
  if (isTokenValid === null) {
    return (
      <Box 
        minH="100vh" 
        bgGradient={bgGradient}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Container maxW="md" textAlign="center">
          <Heading mb={4}>Đang xác thực...</Heading>
          <Text>Vui lòng đợi trong khi chúng tôi xác thực token của bạn.</Text>
        </Container>
      </Box>
    );
  }
  
  // Hiển thị lỗi nếu token không hợp lệ
  if (isTokenValid === false) {
    return (
      <Box 
        minH="100vh" 
        bgGradient={bgGradient}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Container maxW="md" textAlign="center">
          <Image src={flameoLogo} alt="Flameo" h="80px" mx="auto" mb={8} />
          <Alert status="error" mb={6} borderRadius="md">
            <AlertIcon />
            {error || 'Token không hợp lệ hoặc đã hết hạn'}
          </Alert>
          <Text mb={4}>Vui lòng yêu cầu một liên kết đặt lại mật khẩu mới.</Text>
          <Button 
            as={Link} 
            to="/forgot-password" 
            colorScheme="blue"
          >
            Quên mật khẩu
          </Button>
        </Container>
      </Box>
    );
  }
  
  // Form đặt lại mật khẩu
  return (
    <Box 
      minH="100vh" 
      bgGradient={bgGradient}
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={10}
    >
      <Container maxW="md">
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
                Đặt lại mật khẩu
              </Heading>
              
              <Text color="gray.500" textAlign="center">
                Nhập mật khẩu mới của bạn
              </Text>
              
              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  {error}
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <VStack spacing={4} align="stretch">
                  <FormControl isInvalid={error && error.includes('Mật khẩu phải')}>
                    <FormLabel>Mật khẩu mới</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                    <FormErrorMessage>Mật khẩu phải có ít nhất 6 ký tự</FormErrorMessage>
                  </FormControl>
                  
                  <FormControl isInvalid={error && error.includes('không khớp')}>
                    <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                    <InputGroup>
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                    <FormErrorMessage>Mật khẩu xác nhận không khớp</FormErrorMessage>
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
                    Đặt lại mật khẩu
                  </Button>
                </VStack>
              </form>
            </VStack>
          </Box>
          
          <ChakraLink as={Link} to="/login" color="blue.500" fontWeight="bold">
            Quay lại đăng nhập
          </ChakraLink>
        </VStack>
      </Container>
    </Box>
  );
};

export default ResetPasswordPage;