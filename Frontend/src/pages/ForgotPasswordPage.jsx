import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  VStack,
  Link as ChakraLink,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  Image
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import flameoLogo from '../assets/AppAvatar.png'; // Đường dẫn đến logo

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { forgotPassword, isLoading } = useAuthStore();
  const toast = useToast();
  
  const bgGradient = useColorModeValue(
    'linear(to-b, blue.50, gray.50)',
    'linear(to-b, gray.900, gray.800)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: 'Email là bắt buộc',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      await forgotPassword(email);
      setIsSubmitted(true);
      toast({
        title: 'Đã gửi email khôi phục',
        description: 'Vui lòng kiểm tra hộp thư để đặt lại mật khẩu.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Gửi email thất bại',
        description: error.message || 'Đã xảy ra lỗi khi gửi email khôi phục.',
        status: 'error',
        duration: 3000,
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
                Quên mật khẩu
              </Heading>
              
              <Text color="gray.500" textAlign="center">
                Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu
              </Text>
              
              {isSubmitted ? (
                <Alert status="success" borderRadius="md">
                  <AlertIcon />
                  Email với hướng dẫn đặt lại mật khẩu đã được gửi đến {email}. Vui lòng kiểm tra hộp thư của bạn.
                </Alert>
              ) : (
                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel>Email</FormLabel>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
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
                      Gửi email khôi phục
                    </Button>
                  </VStack>
                </form>
              )}
            </VStack>
          </Box>
          
          <VStack spacing={3}>
            <ChakraLink as={Link} to="/login" color="blue.500" fontWeight="bold">
              Quay lại đăng nhập
            </ChakraLink>
            
            <Text>
              Chưa có tài khoản?{' '}
              <ChakraLink as={Link} to="/register" color="blue.500" fontWeight="bold">
                Đăng ký ngay
              </ChakraLink>
            </Text>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default ForgotPasswordPage;