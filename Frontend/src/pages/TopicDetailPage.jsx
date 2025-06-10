import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Flex,
  Badge,
  Progress,
  useColorModeValue,
  IconButton,
  Button,
  Alert,
  AlertIcon,
  Divider,
  Spinner
} from '@chakra-ui/react';
import { ChevronLeftIcon, LockIcon } from '@chakra-ui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import useTopicStore from '../store/topicStore';
import useLessonStore from '../store/lessonStore';
import useProgressStore from '../store/progressStore';

const TopicDetailPage = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  
  const { topics, fetchAllTopics, isLoadingTopics } = useTopicStore();
  const { 
    topicLessons, 
    fetchLessonsByTopic,
    isLoading: isLoadingLessons,
    error
  } = useLessonStore();
  
  const { 
    completedLessons, 
    fetchCompletedLessons, 
    isLoading: isLoadingProgress 
  } = useProgressStore();
  
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [needsRefresh, setNeedsRefresh] = useState(true);
  
  const bgGradient = useColorModeValue(
    'linear(to-b, blue.50, gray.50)',
    'linear(to-b, gray.900, gray.800)'
  );
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const descriptionBg = useColorModeValue('blue.50', 'blue.900');
  const descriptionBorder = useColorModeValue('blue.200', 'blue.700');
  const descriptionText = useColorModeValue('blue.700', 'blue.200');
  const grayBorderLight = useColorModeValue('gray.300', 'gray.600');
  const grayBorderDark = useColorModeValue('gray.300', 'gray.600');
  const greenBorder = useColorModeValue('green.300', 'green.600');
  const grayBg = useColorModeValue('gray.200', 'gray.700');
  const greenBg = useColorModeValue('green.400', 'green.600');
  const blueBg = useColorModeValue('blue.400', 'blue.600');
  const grayText = useColorModeValue('gray.600', 'gray.300');
  
  useEffect(() => {
    const loadData = async () => {
      try {
        if (topics.length === 0) {
          await fetchAllTopics();
        }
        
        if (topicId) {
          await fetchLessonsByTopic(topicId);
        }
        
        await fetchCompletedLessons();
      } catch (error) {
        console.error('Error loading topic data:', error);
      }
    };
    
    loadData();
  }, [topicId, fetchLessonsByTopic, fetchAllTopics, fetchCompletedLessons, topics.length]);
  
  useEffect(() => {
    const topic = topics.find(t => t.topic_id.toString() === topicId.toString());
    setSelectedTopic(topic);
  }, [topics, topicId]);

  useEffect(() => {
    if (needsRefresh && topicId) {
      const refreshData = async () => {
        try {
          await fetchLessonsByTopic(topicId);
          await fetchCompletedLessons();
          if (topics.length > 0) {
            const updatedTopic = topics.find(t => t.topic_id.toString() === topicId.toString());
            setSelectedTopic(updatedTopic);
          }
          setNeedsRefresh(false);
        } catch (error) {
          console.error('Error refreshing data:', error);
        }
      };
      
      refreshData();
    }
  }, [needsRefresh, topicId, fetchLessonsByTopic, fetchCompletedLessons, topics]);
  
  const handleBack = () => {
    navigate('/learn');
  };
  
  const handleStartLesson = (lesson, index) => {
    if (index > 0) {
      const previousLesson = topicLessons[index - 1];
      if (!isLessonCompleted(previousLesson.lesson_id)) {
        return;
      }
    }
    
    navigate(`/lessons/${lesson.lesson_id}`);
  };
  
  const isLessonCompleted = (lessonId) => {
    if (!completedLessons || completedLessons.length === 0) return false;
    
    const lessonIdStr = String(lessonId);
    
    return completedLessons.some(lesson => {
      return (String(lesson.lesson_id) === lessonIdStr && lesson.is_completed === 1);
    });
  };
  
  const isLessonLocked = (index) => {
    if (index === 0) return false;
    
    const previousLesson = topicLessons[index - 1];
    return !isLessonCompleted(previousLesson.lesson_id);
  };
  
  const isLoading = isLoadingTopics || isLoadingLessons || isLoadingProgress;
  
  return (
    <Box 
      p={4} 
      minH="100vh"
      bgGradient={bgGradient}
    >
      <Container maxW="container.lg">
        <VStack spacing={6} align="stretch">
          <Flex align="center" mb={2}>
            <IconButton
              icon={<ChevronLeftIcon boxSize={6} />}
              variant="ghost"
              aria-label="Back"
              mr={2}
              onClick={handleBack}
            />
            <Heading size="lg" color="flameo.500">
              {selectedTopic?.topic_name || 'Danh sách bài học'}
            </Heading>
          </Flex>
          
          {selectedTopic && (
            <Box 
              p={5} 
              bg={descriptionBg}
              borderRadius="lg" 
              borderWidth="1px"
              borderColor={descriptionBorder}
              mb={4}
            >
              <Text color={descriptionText}>{selectedTopic.description}</Text>
              
              <Box mt={4}>
                <Flex justify="space-between" mb={1}>
                  <Text fontWeight="medium">Tiến độ chủ đề</Text>
                  <Text fontWeight="bold">{selectedTopic.completed_percentage || 0}%</Text>
                </Flex>
                <Progress 
                  value={selectedTopic.completed_percentage || 0} 
                  colorScheme="blue" 
                  size="sm" 
                  borderRadius="full"
                />
              </Box>
            </Box>
          )}
          
          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Text>{error}</Text>
            </Alert>
          )}
          
          {isLoading ? (
            <Flex justify="center" py={10}>
              <Spinner size="xl" color="blue.500" />
              <Text ml={4}>Đang tải bài học...</Text>
            </Flex>
          ) : (
            <VStack spacing={4} align="stretch">
              {topicLessons && topicLessons.length > 0 ? (
                topicLessons.map((lesson, index) => {
                  const locked = isLessonLocked(index);
                  const completed = isLessonCompleted(lesson.lesson_id);
                  
                  return (
                    <Box
                      key={lesson.lesson_id}
                      position="relative"
                      bg={cardBg}
                      borderWidth="1px"
                      borderColor={locked ? grayBorderLight : completed ? greenBorder : borderColor}
                      borderRadius="lg"
                      boxShadow={locked ? 'none' : 'md'}
                      overflow="hidden"
                      opacity={locked ? 0.7 : 1}
                      transition="all 0.2s"
                      cursor={locked ? 'not-allowed' : 'pointer'}
                      onClick={() => !locked && handleStartLesson(lesson, index)}
                      _hover={!locked && { transform: 'translateY(-2px)', boxShadow: 'lg' }}
                      _dark={{ bg: 'gray.800' }}
                    >
                      <Flex p={0}>
                        <Box 
                          bg={locked ? grayBg : completed ? greenBg : blueBg} 
                          p={6} 
                          w="100px" 
                          color="white"
                          display="flex"
                          flexDirection="column"
                          alignItems="center"
                          justifyContent="center"
                        >
                          {locked ? (
                            <LockIcon boxSize={8} />
                          ) : (
                            <Text fontSize="xl" fontWeight="bold">{index + 1}</Text>
                          )}
                        </Box>
                        
                        <Box p={4} flex="1">
                          <VStack align="start" spacing={2}>
                            <Flex w="100%" justify="space-between" align="center">
                              <Heading size="md" fontWeight="semibold">
                                {lesson.title}
                              </Heading>
                              {completed ? (
                                <Badge colorScheme="green" fontSize="0.8em" p={1}>
                                  Đã hoàn thành
                                </Badge>
                              ) : locked ? (
                                <Badge colorScheme="gray" fontSize="0.8em" p={1}>
                                  Khóa
                                </Badge>
                              ) : (
                                <Badge colorScheme="blue" fontSize="0.8em" p={1}>
                                  Sẵn sàng
                                </Badge>
                              )}
                            </Flex>
                            
                            <Divider />
                            
                            <Flex w="100%" justify="space-between" fontSize="sm" color={grayText}>
                              <Text>{lesson.total_words || 0} từ vựng</Text>
                              {!locked && (
                                <Flex align="center">
                                  <Text mr={2}>Tiến độ: {lesson.completed_percentage || 0}%</Text>
                                </Flex>
                              )}
                            </Flex>
                            
                            {!locked && (
                              <Progress 
                                value={lesson.completed_percentage || 0} 
                                colorScheme={completed ? "green" : "blue"} 
                                size="sm" 
                                borderRadius="full"
                                w="100%"
                                mt={1}
                              />
                            )}
                          </VStack>
                        </Box>
                      </Flex>
                    </Box>
                  );
                })
              ) : (
                <Flex 
                  direction="column" 
                  align="center" 
                  justify="center" 
                  py={10}
                  bg={cardBg}
                  p={6}
                  borderRadius="lg"
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <Text fontSize="lg" mb={4}>Không có bài học nào trong chủ đề này</Text>
                  <Button 
                    colorScheme="blue" 
                    onClick={handleBack}
                  >
                    Quay lại
                  </Button>
                </Flex>
              )}
            </VStack>
          )}
          
          <Flex justify="center" mt={8}>
            <Button 
              leftIcon={<ChevronLeftIcon />} 
              variant="outline" 
              onClick={handleBack}
            >
              Quay lại danh sách chủ đề
            </Button>
          </Flex>
        </VStack>
      </Container>
    </Box>
  );
};

export default TopicDetailPage;