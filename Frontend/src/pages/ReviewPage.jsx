// src/pages/ReviewPage.jsx - Đã cập nhật với mô hình tách rời
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
  VStack
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import ReviewModal from '../components/ReviewModal';
import ReviewChart from '../components/ReviewChart';
import useVocabularyStore from '../store/vocabularyStore';

const ReviewPage = () => {
  const {
    reviewVocabulary,
    fetchReviewVocabulary,
    markVocabularyStatus,
    hasNoWordsToReview,
    setCurrentVocabIndex
  } = useVocabularyStore();
  
  const [recentWords, setRecentWords] = useState([]); // Từ vựng học 2 ngày gần đây
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [chartKey, setChartKey] = useState(Date.now()); // Key để refresh chart
  const [isExerciseInProgress, setIsExerciseInProgress] = useState(false); // Theo dõi trạng thái đang làm bài
  
  // Sử dụng useDisclosure của Chakra UI để quản lý trạng thái modal
  const { isOpen, onOpen, onClose: closeModal } = useDisclosure();
  
  const toast = useToast();
  const bgGradient = useColorModeValue(
    'linear(to-b, blue.50, gray.50)',
    'linear(to-b, gray.900, gray.800)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Tách hàm fetchRecentVocabulary ra thành callback riêng để có thể gọi lại
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
      // Log để debug
      console.log('ReviewPage - handleMarkNotMemorized called for vocab ID:', vocabId);
      
      // Cập nhật trạng thái từ vựng là chưa thuộc
      await markVocabularyStatus(vocabId, false);
      
      // Force refresh biểu đồ
      setTimeout(() => {
        setChartKey(Date.now());
        
        // Thử refresh chart bằng cách gọi hàm refreshData nếu có
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
      // Log để debug
      console.log('ReviewPage - handleExerciseComplete called for vocab ID:', vocabId, 'isCorrect:', isCorrect);
      
      // Đánh dấu từ vựng là đã thuộc nếu trả lời đúng, chưa thuộc nếu trả lời sai
      await markVocabularyStatus(vocabId, isCorrect);
      
      // Cập nhật lại danh sách từ vựng gần đây để hiển thị đúng số lượng
      await fetchRecentVocabulary();
      
      // Force refresh biểu đồ
      setTimeout(() => {
        setChartKey(Date.now());
        
        // Thử refresh chart bằng cách gọi hàm refreshData nếu có
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
    
    // Đánh dấu bắt đầu bài tập
    setIsExerciseInProgress(true);
    
    // Mở modal
    onOpen();
  };
  
  // Xử lý đóng modal
  const handleCloseModal = () => {
    // Log để debug
    console.log('ReviewPage - handleCloseModal called');
    
    // Chỉ cập nhật trạng thái nếu đã bắt đầu làm bài
    if (isExerciseInProgress) {
      closeModal();
      
      // Cập nhật lại danh sách từ vựng
      fetchReviewVocabulary();
      
      // Cập nhật lại danh sách từ vựng gần đây
      fetchRecentVocabulary();
      
      // Force refresh biểu đồ
      setChartKey(Date.now());
      
      // Reset trạng thái làm bài
      setIsExerciseInProgress(false);
      
      // Reset index về 0
      setCurrentVocabIndex(0);
    } else {
      // Nếu chưa bắt đầu làm bài, chỉ đóng modal
      closeModal();
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
        
        {/* Sử dụng component ReviewModal */}
        <ReviewModal 
          isOpen={isOpen} 
          onClose={handleCloseModal}
          onCompleteExercise={handleExerciseComplete}
          onMarkNotMemorized={handleMarkNotMemorized}
        />
        
      </Container>
    </Box>
  );
};

export default ReviewPage;