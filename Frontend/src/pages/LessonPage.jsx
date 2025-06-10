// src/pages/LessonPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
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
  
  // All hooks must be at the top level - no conditional hooks
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const minHBg = useColorModeValue('white', 'gray.900');
  
  // Store hooks
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
  
  // State hooks
  const [lessonData, setLessonData] = useState(null);
  const [lessonProgress, setLessonProgress] = useState(0);
  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [lessonError, setLessonError] = useState(null);
  const [completedLastWord, setCompletedLastWord] = useState(false);
  
  // Memoized handlers
  const handleBack = useCallback(() => {
    if (lessonData && lessonData.topic_id) {
      sessionStorage.setItem('refreshTopicData', 'true');
      navigate(`/topics/${lessonData.topic_id}`);
    } else {
      navigate('/learn');
    }
  }, [lessonData, navigate]);

  const handleCompleteLesson = useCallback(async () => {
    try {
      await completeLesson(lessonId);
      if (lessonData && lessonData.topic_id) {
        navigate(`/topics/${lessonData.topic_id}`);
      } else {
        navigate('/learn');
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  }, [completeLesson, lessonId, lessonData, navigate]);

  const handleMemorized = useCallback(async (vocabId) => {
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
  }, [markVocabularyStatus, currentVocabIndex, lessonVocabulary, setCurrentVocabIndex]);

  const handleSkip = useCallback(() => {
    if (currentVocabIndex < lessonVocabulary.length - 1) {
      setCurrentVocabIndex(currentVocabIndex + 1);
    }
  }, [currentVocabIndex, lessonVocabulary, setCurrentVocabIndex]);
  
  // Effects
  useEffect(() => {
    const loadData = async () => {
      if (lessonId) {
        try {
          setLocalLoading(true);
          setLessonError(null);
          
          const lessonResult = await fetchLesson(lessonId);
          setLessonData(lessonResult?.data?.lesson || null);
          
          await fetchLessonVocabulary(lessonId);
          setCurrentVocabIndex(0);
          setCompletedLastWord(false);
          setLessonCompleted(false);
        } catch (err) {
          console.error('Error loading lesson data:', err);
          setLessonError(err.message || 'Không thể tải bài học');
        } finally {
          setLocalLoading(false);
        }
      }
    };
    
    loadData();
  }, [lessonId, fetchLesson, fetchLessonVocabulary, setCurrentVocabIndex]);
  
  useEffect(() => {
    if (lessonVocabulary && lessonVocabulary.length > 0) {
      const progress = ((currentVocabIndex + 1) / lessonVocabulary.length) * 100;
      setLessonProgress(progress);

      if (currentVocabIndex !== lessonVocabulary.length - 1) {
        setLessonCompleted(false);
        setCompletedLastWord(false);
      }
    }
  }, [currentVocabIndex, lessonVocabulary]);
  
  // Computed values
  const loading = isLoading || localLoading;
  const displayError = error || lessonError;
  const currentVocab = lessonVocabulary && lessonVocabulary.length > 0 ? lessonVocabulary[currentVocabIndex] : null;
  
  // Render loading state
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
  
  // Render error state
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
  
  // Render empty vocabulary state
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
  
  // Main render
  return (
    <Box p={4} pt="74px" bg={minHBg} minH="100vh">
      <Container maxW="container.lg">
        <VStack spacing={6}>
          {/* Header */}
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

          {/* Completion Alert */}
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
          
          {/* Progress Info */}
          <Flex w="100%" justify="center" align="center">
            <Text fontWeight="medium">
              Từ {currentVocabIndex + 1} / {lessonVocabulary.length}
            </Text>
          </Flex>
          
          {/* Progress Bar */}
          <Progress 
            value={lessonProgress} 
            w="100%" 
            colorScheme="blue" 
            size="sm" 
            borderRadius="full" 
          />
          
          {/* Flash Card */}
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