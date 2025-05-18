// src/pages/ReviewPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  HStack,
  VStack,
  Flex,
  IconButton,
  useToast,
  useColorModeValue,
  Grid,
  GridItem,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  useDisclosure
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
import ReviewExercise from '../components/ReviewExercise';
import ReviewChart from '../components/ReviewChart';
import useVocabularyStore from '../store/vocabularyStore';
import axiosClient from '../api/axiosClient';

const ReviewPage = () => {
  const {
    reviewVocabulary,
    currentVocabIndex,
    fetchReviewVocabulary,
    nextVocabulary,
    previousVocabulary,
    markVocabularyStatus,
    skipCurrentWord,
    isLoading,
    error,
    hasNoWordsToReview
  } = useVocabularyStore();
  
  const [recentWords, setRecentWords] = useState([]); // Từ vựng học 2 ngày gần đây
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [chartKey, setChartKey] = useState(Date.now()); // Thêm state để refresh chart
  const { isOpen, onOpen, onClose } = useDisclosure(); // Modal cho ReviewExercise
  
  const toast = useToast();
  const bgGradient = useColorModeValue(
    'linear(to-b, blue.50, gray.50)',
    'linear(to-b, gray.900, gray.800)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Tách hàm fetchRecentVocabulary ra thành một callback riêng để có thể gọi lại
  const fetchRecentVocabulary = useCallback(async () => {
    try {
      setIsLoadingRecent(true);
      
      // Sử dụng phương thức từ vocabularyStore
      const recentData = await useVocabularyStore.getState().fetchRecentVocabulary();
      console.log("Dữ liệu từ vựng gần đây:", recentData); // Debug
      
      if (recentData && recentData.length > 0) {
        setRecentWords(recentData);
      } else {
        // Nếu không có dữ liệu, gán mảng rỗng
        setRecentWords([]);
      }
    } catch (error) {
      console.error('Error fetching recent vocabulary:', error);
      // Nếu có lỗi, gán mảng rỗng
      setRecentWords([]);
      
      toast({
        title: 'Không thể tải từ vựng gần đây',
        description: error.message || 'Đã xảy ra lỗi khi tải từ vựng',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingRecent(false);
    }
  }, [toast]);
  
  useEffect(() => {
    // Lấy danh sách từ vựng cần ôn tập
    fetchReviewVocabulary();
    
    // Lấy danh sách từ vựng học trong 2 ngày gần đây
    fetchRecentVocabulary();
  }, [fetchReviewVocabulary, fetchRecentVocabulary]);

  // Xử lý đánh dấu từ vựng chưa thuộc
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
      
      // Chuyển sang từ tiếp theo
      nextVocabulary();
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
  
  // Xử lý bỏ qua từ hiện tại
  const handleSkip = () => {
    skipCurrentWord();
    toast({
      title: 'Đã bỏ qua',
      description: "Đã bỏ qua từ vựng này.",
      status: 'info',
      duration: 1000,
      isClosable: true,
    });
  };
  
  // Xử lý hoàn thành bài tập
  const handleExerciseComplete = async (vocabId, isCorrect) => {
    try {
      // Đánh dấu từ vựng là đã thuộc nếu trả lời đúng
      if (isCorrect) {
        await markVocabularyStatus(vocabId, true);
      } else {
        // Nếu trả lời sai, vẫn cập nhật review_count
        await markVocabularyStatus(vocabId, false);
      }
      
      // Cập nhật lại danh sách từ vựng gần đây để hiển thị đúng số lượng
      await fetchRecentVocabulary();
      
      // Force refresh biểu đồ
      setChartKey(Date.now());
      
      // Chuyển sang từ tiếp theo
      setTimeout(() => {
        // Kiểm tra xem còn từ nào cần ôn tập không
        const remainingWords = reviewVocabulary.filter(
          (word, index) => index > currentVocabIndex && word.review_count < 2
        );
        
        if (remainingWords.length === 0 && currentVocabIndex === reviewVocabulary.length - 1) {
          // Nếu đã ôn tập hết tất cả các từ
          toast({
            title: 'Hoàn thành ôn tập',
            description: 'Bạn đã ôn tập xong tất cả các từ!',
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
          
          // Đóng modal
          onClose();
          
          // Cập nhật lại danh sách từ vựng
          fetchReviewVocabulary();
        } else {
          nextVocabulary();
        }
      }, 500);
    } catch (error) {
      console.error('Error updating vocabulary status:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái từ vựng.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Xử lý bắt đầu ôn tập từ học gần đây
  const handleReviewRecentWords = () => {
    // Lọc ra các từ cần ôn tập (review_count < 2)
    const wordsToReview = recentWords.filter(word => word.review_count < 2);
    
    if (wordsToReview.length === 0) {
      toast({
        title: 'Đã ôn tập đủ từ vựng',
        description: 'Bạn đã ôn tập đủ số lần cho các từ học gần đây',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
      return;
    }
    
    // Debug log
    console.log("Bắt đầu ôn tập với dữ liệu:", wordsToReview);
    
    // Cập nhật danh sách từ vựng cần ôn tập với từ học gần đây
    useVocabularyStore.setState({
      reviewVocabulary: wordsToReview,
      currentVocabIndex: 0,
      hasNoWordsToReview: false
    });
    
    toast({
      title: 'Đã tải từ vựng cần ôn tập',
      description: `${wordsToReview.length} từ đang chờ ôn tập`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
    
    // Mở modal
    onOpen();
  };
    
  // Kiểm tra từ hiện tại
  const currentWord = reviewVocabulary[currentVocabIndex];
  const hasWords = reviewVocabulary.length > 0 && !hasNoWordsToReview;
  const hasRecentWords = recentWords.length > 0;
  
  return (
    <Box
      pt="100px"
      pb="50px"
      minH="100vh"
      bgGradient={bgGradient}
    >
      <Container maxW="container.xl">
        <VStack spacing={6} mb={8}>
          <Heading textAlign="center" size="lg" 
            bgGradient="linear(to-r, blue.400, purple.500)" 
            bgClip="text"
          >
            Ôn tập từ vựng
          </Heading>
          
          {/* Chỉ hiển thị thống kê khi có từ vựng gần đây */}
          {hasRecentWords ? (
            <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={6} w="100%">
              <GridItem>
                <ReviewChart key={chartKey} /> {/* Thêm key để force re-render */}
              </GridItem>
              
              <GridItem>
                <Box
                  p={4}
                  bg={cardBg}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={borderColor}
                  boxShadow="md"
                  height="100%"
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-between"
                  _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
                >
                  <VStack align="start" spacing={4}>
                    <Heading size="md">Từ vựng cần ôn tập</Heading>
                    
                    {/* Thay đổi cách hiển thị để rõ ràng hơn */}
                    <Text>Tổng từ trong 2 ngày: <Badge colorScheme="blue" fontSize="md">{recentWords.length}</Badge></Text>
                    <Text>Tổng từ cần ôn tập: <Badge colorScheme="purple" fontSize="md">
                      {recentWords.filter(word => word.review_count < 2).length}
                    </Badge></Text>
                    <Text>Đã ôn tập xong: <Badge colorScheme="green" fontSize="md">
                      {recentWords.filter(word => word.review_count >= 2).length}
                    </Badge></Text>
                  </VStack>
                  
                  <Button 
                    colorScheme="blue" 
                    mt={4} 
                    w="100%"
                    onClick={handleReviewRecentWords}
                    isLoading={isLoadingRecent}
                    isDisabled={recentWords.filter(word => word.review_count < 2).length === 0}
                  >
                    Ôn tập từ gần đây
                  </Button>
                </Box>
              </GridItem>
            </Grid>
          ) : (
            <Flex direction="column" align="center" justify="center" minH="40vh">
              <Heading size="lg" mb={4} textAlign="center">
                Bạn chưa có từ nào cần ôn tập
              </Heading>
              <Text mb={6} color="gray.500" textAlign="center">
                Hãy bắt đầu học từ mới hoặc sử dụng ôn tập từ gần đây để luyện tập nhé!
              </Text>
              <Button as={Link} to="/learn" colorScheme="blue" size="lg">
                Học từ mới
              </Button>
            </Flex>
          )}
        </VStack>
        
        {/* Modal hiển thị bài tập ôn tập */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered scrollBehavior="inside">
          <ModalOverlay />
          <ModalContent>
            <ModalBody p={0} borderRadius="lg">
              {currentWord && (
                <Box position="relative">
                  <ReviewExercise 
                    vocabulary={currentWord}
                    onComplete={handleExerciseComplete}
                    onMarkNotMemorized={handleMarkNotMemorized}
                    options={reviewVocabulary}
                    key={currentVocabIndex} // Thêm key để component được tạo mới khi chuyển từ
                  />
                  
                  {/* Nút điều hướng */}
                  <HStack spacing={4} justify="center" mt={4} mb={6}>
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
                </Box>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </Container>
    </Box>
  );
};

export default ReviewPage;