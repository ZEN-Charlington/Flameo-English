// src/pages/LessonPage.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Flex,
  Progress,
  Button,
  IconButton,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  useColorModeValue
} from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import FlashCard from '../components/FlashCard';
import useLessonStore from '../store/lessonStore';
import useVocabularyStore from '../store/vocabularyStore';
import useProgressStore from '../store/progressStore';

const LessonPage = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  
  const { 
    fetchLesson, 
    fetchLessonVocabulary, 
    lessonVocabulary,
    isLoading, 
    error,
    setError
  } = useLessonStore();
  
  const { 
    currentVocabIndex, 
    setCurrentVocabIndex,
    markVocabularyStatus 
  } = useVocabularyStore();

  const { completeLesson } = useProgressStore();
  const [lessonData, setLessonData] = useState(null);
  const [lessonProgress, setLessonProgress] = useState(0);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [lessonError, setLessonError] = useState(null);
  const [completedLastWord, setCompletedLastWord] = useState(false);
  
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Lấy thông tin bài học và từ vựng
  useEffect(() => {
    const loadData = async () => {
      if (lessonId) {
        try {
          setLocalLoading(true);
          
          // Fetch lesson data
          const lessonData = await fetchLesson(lessonId);
          setLessonData(lessonData?.data?.lesson || null);
          
          // Fetch vocabulary
          await fetchLessonVocabulary(lessonId);
          
          // Reset index về 0 mỗi khi load bài học mới
          setCurrentVocabIndex(0);
          setCompletedLastWord(false);
          
          setLocalLoading(false);
        } catch (err) {
          console.error('Error loading lesson data:', err);
          setLocalLoading(false);
          setLessonError(err.message || 'Không thể tải bài học');
        }
      }
    };
    
    loadData();
  }, [lessonId, fetchLesson, fetchLessonVocabulary, setCurrentVocabIndex]);
  
  // Cập nhật tiến độ học
  useEffect(() => {
    if (lessonVocabulary && lessonVocabulary.length > 0) {
      const progress = ((currentVocabIndex + 1) / lessonVocabulary.length) * 100;
      setLessonProgress(progress);
      
      // Kiểm tra xem đã đến từ cuối cùng chưa, nhưng KHÔNG đặt lessonCompleted ở đây
      if (currentVocabIndex === lessonVocabulary.length - 1) {
        // Khi đến từ cuối, chỉ ghi nhận đã đến từ cuối, nhưng chưa đánh dấu hoàn thành
        // Chúng ta sẽ đánh dấu hoàn thành khi người dùng nhấn "đã học" từ cuối cùng
      } else {
        setLessonCompleted(false);
        setCompletedLastWord(false);
      }
    }
  }, [currentVocabIndex, lessonVocabulary]);
  
  // Xử lý khi đã nhớ từ vựng - đánh dấu là đã nhớ và chuyển sang từ tiếp theo
  const handleMemorized = async (vocabId) => {
    if (!vocabId) {
      console.error("Không tìm thấy vocab_id");
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái từ vựng: Thiếu ID từ vựng',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      // Đánh dấu từ vựng đã học
      await markVocabularyStatus(vocabId, 1);
      
      toast({
        title: 'Đã thuộc từ vựng',
        status: 'success',
        duration: 1000,
        isClosable: true,
      });
      
      // Kiểm tra xem đây có phải là từ cuối cùng không
      if (currentVocabIndex === lessonVocabulary.length - 1) {
        // Đánh dấu rằng từ cuối cùng đã được học
        setCompletedLastWord(true);
        setLessonCompleted(true);
      } else {
        // Chuyển sang từ tiếp theo ngay lập tức nếu không phải từ cuối cùng
        setTimeout(() => {
          setCurrentVocabIndex(currentVocabIndex + 1);
        }, 300);
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái từ vựng:', error);
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể cập nhật trạng thái từ vựng',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Xử lý bỏ qua từ - chỉ chuyển sang từ tiếp theo mà không đánh dấu
  const handleSkip = () => {
    // Chỉ chuyển sang từ tiếp theo, không đánh dấu là đã nhớ
    if (currentVocabIndex < lessonVocabulary.length - 1) {
      setCurrentVocabIndex(currentVocabIndex + 1);
      
      toast({
        title: 'Đã bỏ qua từ vựng',
        status: 'info',
        duration: 1000,
        isClosable: true,
      });
    } else {
      toast({
        title: 'Đây là từ cuối cùng',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    }
  };
  
  const handleCompleteLesson = async () => {
    try {
      const result = await completeLesson(lessonId);
      
      // Hiển thị thông báo phù hợp dựa trên kết quả
      if (result && result.partial_success) {
        toast({
          title: 'Đã hoàn thành!',
          description: 'Bài học đã được đánh dấu hoàn thành, nhưng có thể chưa cập nhật đầy đủ tiến độ.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Chúc mừng!',
          description: 'Bạn đã hoàn thành bài học này',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      // Quay lại trang chi tiết chủ đề
      if (lessonData && lessonData.topic_id) {
        navigate(`/topics/${lessonData.topic_id}`);
      } else {
        navigate('/learn');
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật tiến độ bài học. Bạn vẫn có thể tiếp tục học.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const handleBack = () => {
    if (lessonData && lessonData.topic_id) {
      // Tạo state refresh cho topicDetailPage
      sessionStorage.setItem('refreshTopicData', 'true');
      navigate(`/topics/${lessonData.topic_id}`);
    } else {
      navigate('/learn');
    }
  };
    
  const loading = isLoading || localLoading;
  const displayError = error || lessonError;
  
  if (loading) {
    return (
      <Box p={4} pt="74px">
        <Container maxW="container.lg">
          <Flex direction="column" align="center" justify="center" h="70vh">
            <Spinner size="xl" color="blue.500" mb={4} />
            <Text fontSize="xl">Đang tải bài học...</Text>
          </Flex>
        </Container>
      </Box>
    );
  }
  
  if (displayError) {
    return (
      <Box p={4} pt="74px">
        <Container maxW="container.lg">
          <Flex direction="column" align="center" justify="center" h="70vh">
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <AlertTitle>Lỗi!</AlertTitle>
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
            <Button mt={4} onClick={handleBack}>Quay lại</Button>
          </Flex>
        </Container>
      </Box>
    );
  }
  
  if (!lessonVocabulary || lessonVocabulary.length === 0) {
    return (
      <Box p={4} pt="74px">
        <Container maxW="container.lg">
          <Flex direction="column" align="center" justify="center" h="70vh">
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <AlertTitle>Thông báo</AlertTitle>
              <AlertDescription>Bài học này chưa có từ vựng nào</AlertDescription>
            </Alert>
            <Button mt={4} onClick={handleBack}>Quay lại</Button>
          </Flex>
        </Container>
      </Box>
    );
  }
  
  const currentVocab = lessonVocabulary[currentVocabIndex];
  
  return (
    <Box p={4} pt="74px" bg={useColorModeValue('white', 'gray.900')} minH="100vh">
      <Container maxW="container.lg">
        <VStack spacing={6}>
          {/* Tiêu đề và nút quay lại */}
          <Flex w="100%" align="center">
            <IconButton
              icon={<ChevronLeftIcon boxSize={6} />}
              variant="ghost"
              aria-label="Back"
              mr={2}
              onClick={handleBack}
            />
            <VStack align="flex-start" spacing={0}>
              <Heading size="md" color="gray.500">Bài học</Heading>
              <Heading size="lg">{lessonData?.title || 'Học từ vựng'}</Heading>
            </VStack>
          </Flex>
          
          {/* Thông báo hoàn thành - Chỉ hiển thị khi đã hoàn thành từ cuối cùng */}
          {lessonCompleted && completedLastWord && (
            <Alert status="success" borderRadius="md" mt={4}>
              <AlertIcon />
              <AlertTitle>Chúc mừng!</AlertTitle>
              <AlertDescription>Bạn đã hoàn thành bài học này.</AlertDescription>
              <Button ml="auto" colorScheme="green" size="sm" onClick={handleCompleteLesson}>
                Kết thúc
              </Button>
            </Alert>
          )}
          
          {/* Tiến độ - Đã loại bỏ phần hiển thị % */}
          <Flex w="100%" justify="center" align="center">
            <Text fontWeight="medium">
              Từ {currentVocabIndex + 1} / {lessonVocabulary.length}
            </Text>
          </Flex>
          
          <Progress 
            value={lessonProgress} 
            w="100%" 
            colorScheme="blue" 
            size="sm" 
            borderRadius="full" 
          />
          
          {/* FlashCard */}
          {currentVocab && (
            <FlashCard
              vocabulary={currentVocab}
              onMarkMemorized={handleMemorized}
              onSkip={handleSkip}
            />
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default LessonPage;