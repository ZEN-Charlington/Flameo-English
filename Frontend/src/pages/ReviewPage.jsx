import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  HStack,
  VStack,
  Flex,
  Progress,
  IconButton,
  useToast,
  useColorModeValue
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import FlashCard from '../components/FlashCard';
import useVocabularyStore from '../store/vocabularyStore';
import { Link } from 'react-router-dom';


const ReviewPage = () => {
  const {
    reviewVocabulary,
    currentVocabIndex,
    fetchReviewVocabulary,
    nextVocabulary,
    previousVocabulary,
    markVocabularyStatus,
    isLoading,
    error
  } = useVocabularyStore();
  
  const [progress, setProgress] = useState(0);
  const toast = useToast();
  const bgGradient = useColorModeValue(
    'linear(to-b, blue.50, gray.50)',
    'linear(to-b, gray.900, gray.800)'
  );
  
  useEffect(() => {
    fetchReviewVocabulary();
  }, [fetchReviewVocabulary]);
  
  useEffect(() => {
    if (reviewVocabulary.length > 0) {
      setProgress((currentVocabIndex / reviewVocabulary.length) * 100);
    }
  }, [currentVocabIndex, reviewVocabulary]);
  
  const handleMarkMemorized = async (vocabId) => {
    try {
      await markVocabularyStatus(vocabId, true);
      toast({
        title: 'Đã đánh dấu từ vựng',
        description: "Từ vựng đã được đánh dấu là đã nhớ.",
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      
      // Tự động chuyển sang từ tiếp theo sau 1 giây
      setTimeout(() => {
        nextVocabulary();
      }, 1000);
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái từ vựng.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handleMarkNotMemorized = async (vocabId) => {
    try {
      await markVocabularyStatus(vocabId, false);
      toast({
        title: 'Đã đánh dấu từ vựng',
        description: "Từ vựng đã được đánh dấu là chưa nhớ.",
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái từ vựng.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Nếu đang tải
  if (isLoading) {
    return (
      <Container maxW="container.lg" pt="100px" pb="50px">
        <Flex direction="column" align="center" justify="center" h="60vh">
          <Text fontSize="xl">Đang tải danh sách ôn tập...</Text>
        </Flex>
      </Container>
    );
  }
  
  // Nếu có lỗi
  if (error) {
    return (
      <Container maxW="container.lg" pt="100px" pb="50px">
        <Flex direction="column" align="center" justify="center" h="60vh">
          <Text fontSize="xl" color="red.500">Đã xảy ra lỗi: {error}</Text>
          <Button mt={4} onClick={fetchReviewVocabulary}>Thử lại</Button>
        </Flex>
      </Container>
    );
  }
  
  // Nếu không có từ vựng để ôn tập
  if (reviewVocabulary.length === 0) {
    return (
      <Container maxW="container.lg" pt="100px" pb="50px">
        <Flex direction="column" align="center" justify="center" h="60vh">
          <Heading size="lg" mb={4} textAlign="center">
            Không có từ vựng nào cần ôn tập
          </Heading>
          <Text mb={6} color="gray.500" textAlign="center">
            Tất cả các từ vựng đã được ôn tập. Hãy học thêm từ mới hoặc quay lại sau.
          </Text>
          <Button as={Link} to="/learn" colorScheme="blue" size="lg">
            Học từ mới
          </Button>
        </Flex>
      </Container>
    );
  }
  
  const currentWord = reviewVocabulary[currentVocabIndex];
  
  return (
    <Box
      pt="100px"
      pb="50px"
      minH="100vh"
      bgGradient={bgGradient}
    >
      <Container maxW="container.lg">
        <VStack spacing={6} mb={8}>
          <Heading textAlign="center" size="lg" 
            bgGradient="linear(to-r, blue.400, purple.500)" 
            bgClip="text"
          >
            Ôn tập từ vựng
          </Heading>
          
          <Flex w="100%" justify="space-between" align="center">
            <Text>Tiến độ: {currentVocabIndex + 1} / {reviewVocabulary.length}</Text>
            <Text>{Math.round(progress)}%</Text>
          </Flex>
          
          <Progress 
            value={progress} 
            w="100%" 
            colorScheme="blue" 
            size="sm" 
            borderRadius="full" 
          />
        </VStack>
        
        {/* Thẻ từ vựng */}
        <FlashCard 
          vocabulary={currentWord}
          onMarkMemorized={handleMarkMemorized}
          onMarkNotMemorized={handleMarkNotMemorized}
        />
        
        {/* Nút điều hướng */}
        <HStack spacing={4} justify="center" mt={6}>
          <IconButton
            icon={<ChevronLeftIcon boxSize={6} />}
            colorScheme="gray"
            variant="outline"
            isDisabled={currentVocabIndex === 0}
            onClick={previousVocabulary}
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
            onClick={nextVocabulary}
            aria-label="Từ tiếp theo"
          />
        </HStack>
      </Container>
    </Box>
  );
};

export default ReviewPage;