// src/components/ReviewModal.jsx
import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Box,
  HStack,
  Text,
  IconButton,
  CloseButton,
  useColorModeValue
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import useVocabularyStore from '../store/vocabularyStore';
import ReviewExercise from './ReviewExercise';

// Component ReviewModal chỉ quản lý hiển thị modal
const ReviewModal = ({
  isOpen,
  onClose,
  onCompleteExercise,
  onMarkNotMemorized
}) => {
  const {
    reviewVocabulary,
    currentVocabIndex,
    nextVocabulary,
    previousVocabulary,
    setCurrentVocabIndex
  } = useVocabularyStore();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  
  // Xử lý đóng modal an toàn
  const handleClose = () => {
    // Log để debug
    console.log('ReviewModal - handleClose called');
    
    // Gọi callback onClose
    if (typeof onClose === 'function') {
      onClose();
    }
  };
  
  // Xử lý việc hoàn thành bài tập
  const handleComplete = (vocabId, isCorrect, isLastWord) => {
    console.log('ReviewModal - handleComplete called, isLastWord:', isLastWord);
    
    // Gọi callback để cập nhật trạng thái từ vựng
    if (typeof onCompleteExercise === 'function') {
      onCompleteExercise(vocabId, isCorrect);
    }
    
    if (isLastWord) {
      // Nếu là từ cuối cùng, đóng modal
      handleClose();
    } else {
      // Nếu không phải từ cuối, chuyển sang từ tiếp theo
      nextVocabulary();
    }
  };
  
  // Xử lý khi người dùng đánh dấu không thuộc từ
  const handleMarkNotMemorized = (vocabId, isLastWord) => {
    console.log('ReviewModal - handleMarkNotMemorized called, isLastWord:', isLastWord);
    
    // Gọi callback để cập nhật trạng thái từ vựng
    if (typeof onMarkNotMemorized === 'function') {
      onMarkNotMemorized(vocabId);
    }
    
    if (isLastWord) {
      // Nếu là từ cuối cùng, đóng modal
      handleClose();
    } else {
      // Nếu không phải từ cuối, chuyển sang từ tiếp theo
      nextVocabulary();
    }
  };
  
  // Lấy từ vựng hiện tại
  const currentWord = reviewVocabulary[currentVocabIndex];
  
  // Xử lý các nút điều hướng
  const handlePrevious = () => {
    previousVocabulary();
  };
  
  const handleNext = () => {
    nextVocabulary();
  };
  
  // Trả về null nếu không có từ vựng
  if (!currentWord || reviewVocabulary.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalBody textAlign="center" py={8}>
            Không có từ vựng nào để hiển thị.
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      size="lg" 
      isCentered 
      scrollBehavior="inside"
      closeOnOverlayClick={true}
      closeOnEsc={true}
      motionPreset="scale"
      onEscapeKeyDown={handleClose}
    >
      <ModalOverlay />
      <ModalContent maxH="85vh">
        <ModalBody p={0} borderRadius="lg">
          <Box position="relative">
            {/* Box bên ngoài để chứa nội dung và nút đóng */}
            <Box
              p={6}
              borderRadius="lg"
              bg={bgColor}
              w="100%"
              _dark={{ bg: 'gray.800' }}
              minH="420px"
              position="relative"
            >
              {/* Nút đóng */}
              <CloseButton 
                position="absolute" 
                right="3" 
                top="3" 
                onClick={handleClose}
                zIndex="2"
              />
              
              {/* Component ReviewExercise */}
              <ReviewExercise 
                vocabulary={currentWord}
                onComplete={handleComplete}
                onMarkNotMemorized={handleMarkNotMemorized}
                key={`review-exercise-${currentVocabIndex}-${currentWord.vocab_id}`} 
              />
            </Box>
            
            {/* Nút điều hướng */}
            <HStack spacing={4} justify="center" mt={4} mb={6}>
              <IconButton
                icon={<ChevronLeftIcon boxSize={6} />}
                colorScheme="gray"
                variant="outline"
                isDisabled={currentVocabIndex === 0}
                onClick={handlePrevious}
                aria-label="Từ trước đó"
              />
              
              <Text mx={2}>
                {currentVocabIndex + 1} / {reviewVocabulary.length}
              </Text>
              
              <IconButton
                icon={<ChevronRightIcon boxSize={6} />}
                colorScheme="gray"
                variant="outline"
                isDisabled={currentVocabIndex === reviewVocabulary.length - 1}
                onClick={handleNext}
                aria-label="Từ tiếp theo"
              />
            </HStack>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ReviewModal;