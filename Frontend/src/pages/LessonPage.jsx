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
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  useEffect(() => {
    const loadData = async () => {
      if (lessonId) {
        try {
          setLocalLoading(true);
          const lessonData = await fetchLesson(lessonId);
          setLessonData(lessonData?.data?.lesson || null);
          await fetchLessonVocabulary(lessonId);
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
  
  useEffect(() => {
    if (lessonVocabulary && lessonVocabulary.length > 0) {
      const progress = ((currentVocabIndex + 1) / lessonVocabulary.length) * 100;
      setLessonProgress(progress);

      if (currentVocabIndex === lessonVocabulary.length - 1) {
        // Đã tới từ cuối
      } else {
        setLessonCompleted(false);
        setCompletedLastWord(false);
      }
    }
  }, [currentVocabIndex, lessonVocabulary]);
  
  const handleMemorized = async (vocabId) => {
    if (!vocabId) {
      console.error("Không tìm thấy vocab_id");
      return;
    }
    
    try {
      await markVocabularyStatus(vocabId, 1);
      if (currentVocabIndex === lessonVocabulary.length - 1) {
        setCompletedLastWord(true);
        setLessonCompleted(true);
      } else {
        setTimeout(() => {
          setCurrentVocabIndex(currentVocabIndex + 1);
        }, 300);
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái từ vựng:', error);
    }
  };
  
  const handleSkip = () => {
    if (currentVocabIndex < lessonVocabulary.length - 1) {
      setCurrentVocabIndex(currentVocabIndex + 1);
    }
  };
  
  const handleCompleteLesson = async () => {
    try {
      const result = await completeLesson(lessonId);
      if (lessonData && lessonData.topic_id) {
        navigate(`/topics/${lessonData.topic_id}`);
      } else {
        navigate('/learn');
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };
  
  const handleBack = () => {
    if (lessonData && lessonData.topic_id) {
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
