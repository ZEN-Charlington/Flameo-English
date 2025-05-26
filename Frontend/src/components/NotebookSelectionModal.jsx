// src/components/NotebookSelectionModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Button,
  Text,
  Badge,
  Box,
  useColorModeValue,
  useToast,
  Skeleton,
  SkeletonText
} from '@chakra-ui/react';
import useVocabularyStore from '../store/vocabularyStore';

const NotebookSelectionModal = ({ isOpen, onClose, onStartReview }) => {
  const {
    notebookData,
    fetchNotebookVocabularyStats, // Sửa tên method
    startNotebookReview,
    isLoading
  } = useVocabularyStore();
  
  const [isStarting, setIsStarting] = useState(false);
  const toast = useToast();
  
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Load dữ liệu sổ tay khi modal mở
  useEffect(() => {
    if (isOpen) {
      fetchNotebookVocabularyStats(); // Sửa tên method
    }
  }, [isOpen, fetchNotebookVocabularyStats]); // Sửa dependency
  
  // Xử lý bắt đầu ôn tập
  const handleStartReview = async (reviewType) => {
    try {
      setIsStarting(true);
      
      const vocabularyData = await startNotebookReview(reviewType);
      
      if (vocabularyData && vocabularyData.length > 0) {
        // Đóng modal selection
        onClose();
        
        // Gọi callback để mở review modal
        if (typeof onStartReview === 'function') {
          onStartReview();
        }
        
        toast({
          title: 'Bắt đầu ôn tập',
          description: `Đã tải ${vocabularyData.length} từ vựng ${reviewType === 'memorized' ? 'đã thuộc' : 'chưa thuộc'}`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error starting notebook review:', error);
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể bắt đầu ôn tập',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsStarting(false);
    }
  };
  
  const stats = notebookData?.stats || {
    total: 0,
    memorized_count: 0,
    not_memorized_count: 0
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader textAlign="center">
          Ôn tập từ trong sổ tay
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pb={6}>
          <VStack spacing={4}>
            {/* Thống kê sổ tay */}
            {isLoading ? (
              <Box w="100%" p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                <SkeletonText mt="4" noOfLines={3} spacing="4" />
              </Box>
            ) : (
              <Box w="100%" p={4} bg={cardBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                <Text fontWeight="bold" mb={2} textAlign="center">Thống kê sổ tay</Text>
                <VStack spacing={2} align="start">
                  <Text>Tổng từ đã học: <Badge colorScheme="blue" fontSize="md">{stats.total}</Badge></Text>
                  <Text>Từ đã thuộc: <Badge colorScheme="green" fontSize="md">{stats.memorized_count}</Badge></Text>
                  <Text>Từ chưa thuộc: <Badge colorScheme="orange" fontSize="md">{stats.not_memorized_count}</Badge></Text>
                </VStack>
              </Box>
            )}
            
            {/* Nút chọn loại ôn tập */}
            <Text textAlign="center" fontWeight="medium">Chọn loại từ vựng muốn ôn tập:</Text>
            
            {isLoading ? (
              <VStack spacing={3} w="100%">
                <Skeleton height="60px" width="100%" />
                <Skeleton height="60px" width="100%" />
              </VStack>
            ) : (
              <VStack spacing={3} w="100%">
                <Button
                  size="lg"
                  colorScheme="green"
                  variant="outline"
                  w="100%"
                  h="60px"
                  onClick={() => handleStartReview('memorized')}
                  isLoading={isStarting}
                  isDisabled={stats.memorized_count === 0}
                  leftIcon={<Badge colorScheme="green" fontSize="lg">{stats.memorized_count}</Badge>}
                >
                  Ôn tập từ đã thuộc
                </Button>
                
                <Button
                  size="lg"
                  colorScheme="orange"
                  variant="outline"
                  w="100%"
                  h="60px"
                  onClick={() => handleStartReview('not_memorized')}
                  isLoading={isStarting}
                  isDisabled={stats.not_memorized_count === 0}
                  leftIcon={<Badge colorScheme="orange" fontSize="lg">{stats.not_memorized_count}</Badge>}
                >
                  Ôn tập từ chưa thuộc
                </Button>
              </VStack>
            )}
            
            {stats.total === 0 && !isLoading && (
              <Text textAlign="center" color="gray.500" mt={4}>
                Sổ tay của bạn đang trống. Hãy bắt đầu học từ mới!
              </Text>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default NotebookSelectionModal;