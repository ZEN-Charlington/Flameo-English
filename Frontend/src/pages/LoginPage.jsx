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
  Image
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import flameoLogo from '../assets/AppAvatar.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  
  const bgGradient = useColorModeValue(
    'linear(to-b, blue.50, gray.50)',
    'linear(to-b, gray.900, gray.800)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Thông tin không đầy đủ',
        description: 'Vui lòng nhập email và mật khẩu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      await login(email, password);
      navigate('/review');
    } catch (error) {
      toast({
        title: 'Đăng nhập thất bại',
        description: error.message || 'Vui lòng kiểm tra lại thông tin đăng nhập',
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
                Đăng nhập
              </Heading>
              
              <Text color="gray.500" textAlign="center">
                Đăng nhập để tiếp tục học tiếng Anh cùng Flameo
              </Text>
              
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
                  
                  <FormControl>
                    <FormLabel>Mật khẩu</FormLabel>
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
                  </FormControl>
                  
                  <ChakraLink alignSelf="flex-end" fontSize="sm" as={Link} to="/forgot-password">
                    Quên mật khẩu?
                  </ChakraLink>
                  
                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    w="full"
                    isLoading={isLoading}
                    bgGradient="linear(to-r, blue.400, purple.500)"
                    _hover={{
                      bgGradient: "linear(to-r, blue.500, purple.600)"
                    }}
                  >
                    Đăng nhập
                  </Button>
                </VStack>
              </form>
            </VStack>
          </Box>
          
          <Text>
            Chưa có tài khoản?{' '}
            <ChakraLink as={Link} to="/register" color="blue.500" fontWeight="bold">
              Đăng ký ngay
            </ChakraLink>
          </Text>
        </VStack>
      </Container>
    </Box>
  );
};

export default LoginPage;