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
  VStack,
  HStack,
  PinInput,
  PinInputField,
  Link as ChakraLink,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Image,
  Divider,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import flameoLogo from '../assets/AppAvatar.png';

const OTPVerificationPage = () => {
  const [step, setStep] = useState('verify'); // 'verify' hoặc 'reset'
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(900); // 15 phút = 900 giây
  const [email, setEmail] = useState('');
  
  const { verifyOTP, resetPassword, forgotPassword, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  const bgGradient = useColorModeValue(
    'linear(to-b, blue.50, gray.50)',
    'linear(to-b, gray.900, gray.800)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');

  // Lấy email từ state khi navigate từ forgot-password
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      // Nếu không có email, redirect về forgot-password
      navigate('/forgot-password');
    }
  }, [location.state, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Format countdown thời gian
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Xác thực OTP
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'OTP không hợp lệ',
        description: 'Vui lòng nhập đầy đủ 6 chữ số',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await verifyOTP(otp);
      setStep('reset');
      toast({
        title: 'Xác thực thành công',
        description: 'Vui lòng nhập mật khẩu mới',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Xác thực thất bại',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Đặt lại mật khẩu
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: 'Thông tin không đầy đủ',
        description: 'Vui lòng nhập đầy đủ mật khẩu mới và xác nhận',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Mật khẩu không khớp',
        description: 'Mật khẩu xác nhận không trùng khớp',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Mật khẩu quá ngắn',
        description: 'Mật khẩu phải có ít nhất 6 ký tự',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await resetPassword(otp, newPassword);
      toast({
        title: 'Đặt lại mật khẩu thành công',
        description: 'Bạn có thể đăng nhập với mật khẩu mới',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate('/login');
    } catch (error) {
      if (error.message.includes('trùng với mật khẩu cũ')) {
        toast({
          title: 'Mật khẩu trùng lặp',
          description: 'Mật khẩu mới không được trùng với mật khẩu cũ. Bạn có muốn tiếp tục với mật khẩu hiện tại?',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Đặt lại mật khẩu thất bại',
          description: error.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  // Gửi lại OTP
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    try {
      await forgotPassword(email);
      setCountdown(900); // Reset countdown
      setOtp(''); // Clear OTP input
      toast({
        title: 'Đã gửi lại OTP',
        description: 'Mã OTP mới đã được gửi đến email của bạn',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Gửi lại OTP thất bại',
        description: error.message,
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
                {step === 'verify' ? 'Xác thực OTP' : 'Đặt lại mật khẩu'}
              </Heading>
              
              {step === 'verify' ? (
                <>
                  <Text color="gray.500" textAlign="center">
                    Mã OTP đã được gửi đến email: <strong>{email}</strong>
                  </Text>
                  
                  {countdown > 0 && (
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Mã sẽ hết hạn sau:</AlertTitle>
                        <AlertDescription fontWeight="bold" fontSize="lg">
                          {formatTime(countdown)}
                        </AlertDescription>
                      </Box>
                    </Alert>
                  )}

                  <VStack spacing={4} w="full">
                    <FormControl>
                      <FormLabel textAlign="center">Nhập mã OTP (6 chữ số)</FormLabel>
                      <HStack justify="center">
                        <PinInput 
                          value={otp} 
                          onChange={setOtp}
                          type="number"
                          placeholder=""
                          size="lg"
                        >
                          <PinInputField />
                          <PinInputField />
                          <PinInputField />
                          <PinInputField />
                          <PinInputField />
                          <PinInputField />
                        </PinInput>
                      </HStack>
                    </FormControl>
                    
                    <Button
                      colorScheme="blue"
                      size="lg"
                      w="full"
                      isLoading={isLoading}
                      onClick={handleVerifyOTP}
                      bgGradient="linear(to-r, blue.400, purple.500)"
                      _hover={{
                        bgGradient: "linear(to-r, blue.500, purple.600)"
                      }}
                    >
                      Xác thực OTP
                    </Button>

                    <Divider />

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResendOTP}
                      isDisabled={countdown > 0 || isLoading}
                      color={countdown > 0 ? "gray.400" : "blue.500"}
                    >
                      {countdown > 0 ? `Gửi lại sau ${formatTime(countdown)}` : 'Gửi lại OTP'}
                    </Button>
                  </VStack>
                </>
              ) : (
                <>
                  <Text color="gray.500" textAlign="center">
                    Nhập mật khẩu mới cho tài khoản của bạn
                  </Text>
                  
                  <VStack spacing={4} w="full">
                    <FormControl>
                      <FormLabel>Mật khẩu mới</FormLabel>
                      <InputGroup>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
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
                    
                    <FormControl>
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
                    </FormControl>
                    
                    <Button
                      colorScheme="blue"
                      size="lg"
                      w="full"
                      isLoading={isLoading}
                      onClick={handleResetPassword}
                      bgGradient="linear(to-r, blue.400, purple.500)"
                      _hover={{
                        bgGradient: "linear(to-r, blue.500, purple.600)"
                      }}
                    >
                      Đặt lại mật khẩu
                    </Button>

                    <Button
                      leftIcon={<ArrowBackIcon />}
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep('verify')}
                    >
                      Quay lại nhập OTP
                    </Button>
                  </VStack>
                </>
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

export default OTPVerificationPage;