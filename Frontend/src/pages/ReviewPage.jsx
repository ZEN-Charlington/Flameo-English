// src/pages/ReviewPage.jsx - Cập nhật với tính năng sổ tay
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Flex,
  useToast,
  useColorModeValue,
  Grid,
  GridItem,
  Badge,
  useDisclosure,
  VStack,
  HStack
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { BiBook } from 'react-icons/bi'; // Icon sách cho sổ tay
import { FiClock } from 'react-icons/fi'; // Icon đồng hồ cho từ gần đây
import ReviewModal from '../components/ReviewModal';
import ReviewChart from '../components/ReviewChart';
import NotebookSelectionModal from '../components/NotebookSelectionModal';
import useVocabularyStore from '../store/vocabularyStore';

const ReviewPage = () => {
  const {
    reviewVocabulary,
    fetchReviewVocabulary,
    markVocabularyStatus,
    hasNoWordsToReview,
    setCurrentVocabIndex,
    resetReviewMode
  } = useVocabularyStore();
  
  const [recentWords, setRecentWords] = useState([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [chartKey, setChartKey] = useState(Date.now());
  const [isExerciseInProgress, setIsExerciseInProgress] = useState(false);
  
  // Modal cho review exercise
  const { isOpen: isReviewOpen, onOpen: onReviewOpen, onClose: closeReviewModal } = useDisclosure();
  
  // Modal cho chọn loại ôn tập sổ tay
  const { isOpen: isNotebookOpen, onOpen: onNotebookOpen, onClose: closeNotebookModal } = useDisclosure();
  
  const toast = useToast();
  const bgGradient = useColorModeValue(
    'linear(to-b, blue.50, gray.50)',
    'linear(to-b, gray.900, gray.800)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Tách hàm fetchRecentVocabulary ra thành callback riêng
  const fetchRecentVocabulary = useCallback(async () => {
    try {
      setIsLoadingRecent(true);
      
      const recentData = await useVocabularyStore.getState().fetchRecentVocabulary();
      
      if (recentData && recentData.length > 0) {
        setRecentWords(recentData);
      } else {
        setRecentWords([]);
      }
    } catch (error) {
      console.error('Error fetching recent vocabulary:', error);
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
    // Reset review mode khi vào trang
    resetReviewMode();
    
    // Lấy danh sách từ vựng cần ôn tập
    fetchReviewVocabulary();
    
    // Lấy danh sách từ vựng học trong 2 ngày gần đây
    fetchRecentVocabulary();
  }, [fetchReviewVocabulary, fetchRecentVocabulary, resetReviewMode]);

  // Xử lý đánh dấu từ vựng chưa thuộc
  const handleMarkNotMemorized = async (vocabId) => {
    try {
      
      await markVocabularyStatus(vocabId, false);
      
      setTimeout(() => {
        setChartKey(Date.now());
        
        if (document.querySelector('.recharts-responsive-container')) {
          const chartElement = document.querySelector('.recharts-responsive-container');
          if (chartElement && chartElement.parentNode && typeof chartElement.parentNode.refreshData === 'function') {
            chartElement.parentNode.refreshData();
          }
        }
      }, 300);
      
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
  
  // Xử lý hoàn thành bài tập
  const handleExerciseComplete = async (vocabId, isCorrect) => {
    try {
      
      await markVocabularyStatus(vocabId, isCorrect);
      
      // Cập nhật lại danh sách từ vựng gần đây
      await fetchRecentVocabulary();
      
      setTimeout(() => {
        setChartKey(Date.now());
        
        if (document.querySelector('.recharts-responsive-container')) {
          const chartElement = document.querySelector('.recharts-responsive-container');
          if (chartElement && chartElement.parentNode && typeof chartElement.parentNode.refreshData === 'function') {
            chartElement.parentNode.refreshData();
          }
        }
      }, 300);
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
  
  const handleReviewRecentWords = () => {
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
    
    useVocabularyStore.setState({
      reviewVocabulary: wordsToReview,
      currentVocabIndex: 0,
      hasNoWordsToReview: false,
      reviewMode: 'recent'
    });
    
    toast({
      title: 'Đã tải từ vựng cần ôn tập',
      description: `${wordsToReview.length} từ đang chờ ôn tập`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
    
    setIsExerciseInProgress(true);
    onReviewOpen();
  };
  
  // Xử lý mở modal chọn loại ôn tập sổ tay
  const handleNotebookReview = () => {
    onNotebookOpen();
  };
  
  const handleStartNotebookReview = () => {
    setIsExerciseInProgress(true);
    onReviewOpen();
  };
  
  // Xử lý đóng review modal
  const handleCloseReviewModal = () => {
    
    if (isExerciseInProgress) {
      closeReviewModal();
      
      // Cập nhật lại danh sách từ vựng
      fetchReviewVocabulary();
      fetchRecentVocabulary();
      
      // Force refresh biểu đồ
      setChartKey(Date.now());
      
      // Reset trạng thái
      setIsExerciseInProgress(false);
      setCurrentVocabIndex(0);
      resetReviewMode();
    } else {
      closeReviewModal();
    }
  };
  
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
          
          {hasRecentWords ? (
            <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={6} w="100%">
              <GridItem>
                <ReviewChart key={chartKey} />
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
                    
                    <Text>Tổng từ trong 2 ngày: <Badge colorScheme="blue" fontSize="md">{recentWords.length}</Badge></Text>
                    <Text>Tổng từ cần ôn tập: <Badge colorScheme="purple" fontSize="md">
                      {recentWords.filter(word => word.review_count < 2).length}
                    </Badge></Text>
                    <Text>Đã ôn tập xong: <Badge colorScheme="green" fontSize="md">
                      {recentWords.filter(word => word.review_count >= 2).length}
                    </Badge></Text>
                  </VStack>
                  
                  <VStack spacing={2} mt={4}>
                    {/* Nút ôn tập từ gần đây - đặt lên trên */}
                    <Button 
                      leftIcon={<FiClock />}
                      colorScheme="blue" 
                      size="md"
                      w="100%"
                      onClick={handleReviewRecentWords}
                      isLoading={isLoadingRecent}
                      isDisabled={recentWords.filter(word => word.review_count < 2).length === 0}
                    >
                      Ôn tập từ gần đây
                    </Button>
                    
                    {/* Nút ôn tập sổ tay - đặt xuống dưới */}
                    <Button
                      leftIcon={<BiBook />}
                      colorScheme="blue"
                      size="md"
                      w="100%"
                      onClick={handleNotebookReview}
                    >
                      Ôn tập từ trong sổ tay
                    </Button>
                  </VStack>
                </Box>
              </GridItem>
            </Grid>
          ) : (
            <VStack spacing={6}>
              {/* Nút ôn tập sổ tay khi không có từ gần đây */}
              <Button
                leftIcon={<BiBook />}
                colorScheme="blue"
                size="lg"
                onClick={handleNotebookReview}
              >
                Ôn tập từ trong sổ tay
              </Button>
              
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
            </VStack>
          )}
        </VStack>
        
        {/* Modal chọn loại ôn tập sổ tay */}
        <NotebookSelectionModal 
          isOpen={isNotebookOpen}
          onClose={closeNotebookModal}
          onStartReview={handleStartNotebookReview}
        />
        
        {/* Modal ôn tập */}
        <ReviewModal 
          isOpen={isReviewOpen} 
          onClose={handleCloseReviewModal}
          onCompleteExercise={handleExerciseComplete}
          onMarkNotMemorized={handleMarkNotMemorized}
        />
        
      </Container>
    </Box>
  );
};

export default ReviewPage;