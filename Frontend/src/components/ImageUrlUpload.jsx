// src/components/ImageUrlUpload.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Image,
  Text,
  VStack,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  AlertDescription,
  useToast,
  useColorModeValue,
  Icon,
  Flex
} from '@chakra-ui/react';
import { FiLink, FiCheck, FiX, FiImage, FiEdit3 } from 'react-icons/fi';

const ImageUrlUpload = ({ 
  currentImageUrl = '', 
  onImageChange = () => {},
  placeholder = 'Paste URL ảnh từ internet...'
}) => {
  const [imageUrl, setImageUrl] = useState(currentImageUrl);
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl);
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(!currentImageUrl);
  
  const toast = useToast();
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');

  // Update preview khi currentImageUrl thay đổi
  useEffect(() => {
    if (currentImageUrl) {
      setImageUrl(currentImageUrl);
      setPreviewUrl(currentImageUrl);
      setIsValidUrl(true);
      setIsEditing(false);
    }
  }, [currentImageUrl]);

  // Validate URL ảnh
  const validateImageUrl = (url) => {
    if (!url.trim()) {
      return false;
    }

    // Kiểm tra URL format cơ bản
    try {
      new URL(url);
    } catch {
      return false;
    }

    // Kiểm tra có phải URL ảnh không
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const hasImageExtension = imageExtensions.some(ext => 
      url.toLowerCase().includes(ext)
    );

    // Hoặc check các domain ảnh phổ biến
    const imageDomains = [
      'imgur.com', 'i.imgur.com',
      'images.unsplash.com', 'unsplash.com',
      'cdn.pixabay.com', 'pixabay.com',
      'images.pexels.com', 'pexels.com',
      'drive.google.com',
      'dropbox.com',
      'i.postimg.cc', 'postimg.cc',
      'ibb.co', 'i.ibb.co'
    ];
    
    const hasimageDomain = imageDomains.some(domain => 
      url.toLowerCase().includes(domain)
    );

    return hasImageExtension || hasimageDomain || url.includes('image') || url.includes('photo');
  };

  // Handle URL input change
  const handleUrlChange = (e) => {
    const url = e.target.value;
    setImageUrl(url);
    setError('');
    
    if (url.trim()) {
      const isValid = validateImageUrl(url);
      setIsValidUrl(isValid);
      
      if (!isValid) {
        setError('URL không hợp lệ hoặc không phải là ảnh');
      }
    } else {
      setIsValidUrl(false);
    }
  };

  // Test load ảnh
  const testImageLoad = async (url) => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      
      // Timeout sau 10 giây
      setTimeout(() => resolve(false), 10000);
    });
  };

  // Handle apply URL
  const handleApplyUrl = async () => {
    if (!imageUrl.trim()) {
      setError('Vui lòng nhập URL ảnh');
      return;
    }

    if (!isValidUrl) {
      setError('URL không hợp lệ');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Test xem ảnh có load được không
      const canLoad = await testImageLoad(imageUrl);
      
      if (!canLoad) {
        setError('Không thể tải ảnh từ URL này. Vui lòng kiểm tra lại.');
        setIsLoading(false);
        return;
      }

      // Ảnh hợp lệ
      setPreviewUrl(imageUrl);
      setIsEditing(false);
      
      // Gọi callback để parent component biết
      onImageChange(imageUrl);
      
      toast({
        title: 'Thành công',
        description: 'Ảnh đã được cập nhật',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      setError('Có lỗi xảy ra khi kiểm tra ảnh');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit
  const handleEdit = () => {
    setIsEditing(true);
    setImageUrl(previewUrl);
  };

  // Handle cancel
  const handleCancel = () => {
    setIsEditing(false);
    setImageUrl(previewUrl);
    setError('');
  };

  // Handle remove
  const handleRemove = () => {
    setImageUrl('');
    setPreviewUrl('');
    setIsValidUrl(false);
    setIsEditing(true);
    setError('');
    onImageChange('');
    
    toast({
      title: 'Đã xóa ảnh',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Preview hoặc Input */}
      {!isEditing && previewUrl ? (
        // Hiển thị ảnh preview
        <Box p={4} bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <VStack spacing={3}>
            <Box position="relative">
              <Image
                src={previewUrl}
                alt="Preview"
                borderRadius="lg"
                objectFit="cover"
                maxH="200px"
                maxW="300px"
                mx="auto"
                fallback={
                  <Flex 
                    align="center" 
                    justify="center" 
                    h="200px" 
                    bg={bgColor} 
                    borderRadius="lg"
                    border="1px solid"
                    borderColor={borderColor}
                  >
                    <VStack spacing={2}>
                      <Icon as={FiImage} boxSize={8} color="gray.400" />
                      <Text color="gray.500" fontSize="sm">Đang tải ảnh...</Text>
                    </VStack>
                  </Flex>
                }
              />
            </Box>
            
            <HStack spacing={2}>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<FiEdit3 />}
                onClick={handleEdit}
              >
                Thay đổi
              </Button>
              <Button
                size="sm"
                variant="outline"
                colorScheme="red"
                leftIcon={<FiX />}
                onClick={handleRemove}
              >
                Xóa
              </Button>
            </HStack>
          </VStack>
        </Box>
      ) : (
        // Form nhập URL
        <Box p={4} bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <FormControl>
            <FormLabel>URL ảnh</FormLabel>
            <VStack spacing={3} align="stretch">
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <Icon as={FiLink} color="gray.400" />
                </InputLeftElement>
                <Input
                  value={imageUrl}
                  onChange={handleUrlChange}
                  placeholder={placeholder}
                  pl={10}
                />
              </InputGroup>
              
              {/* Preview nhỏ nếu URL hợp lệ */}
              {imageUrl && isValidUrl && (
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={2}>Preview:</Text>
                  <Image
                    src={imageUrl}
                    alt="Preview"
                    maxH="100px"
                    maxW="150px"
                    borderRadius="md"
                    objectFit="cover"
                    fallback={
                      <Box 
                        w="150px" 
                        h="100px" 
                        bg={bgColor} 
                        borderRadius="md" 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="center"
                      >
                        <Text fontSize="xs" color="gray.500">Loading...</Text>
                      </Box>
                    }
                  />
                </Box>
              )}
              
              {/* Error message */}
              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription fontSize="sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Buttons */}
              <HStack spacing={2}>
                <Button
                  colorScheme="blue"
                  leftIcon={<FiCheck />}
                  onClick={handleApplyUrl}
                  isLoading={isLoading}
                  isDisabled={!isValidUrl || !imageUrl.trim()}
                  size="sm"
                >
                  Áp dụng
                </Button>
                
                {previewUrl && (
                  <Button
                    variant="outline"
                    leftIcon={<FiX />}
                    onClick={handleCancel}
                    size="sm"
                  >
                    Hủy
                  </Button>
                )}
              </HStack>
            </VStack>
          </FormControl>
        </Box>
      )}
      
      {/* Hướng dẫn */}
      <Text fontSize="xs" color="gray.500" textAlign="center">
        💡 Tip: Right-click vào ảnh trên mạng → "Copy image address" → paste vào đây
      </Text>
    </VStack>
  );
};

export default ImageUrlUpload;