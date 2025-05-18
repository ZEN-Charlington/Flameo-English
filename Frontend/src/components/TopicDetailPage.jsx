// src/pages/TopicDetailPage.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Image,
  Badge,
  Progress,
  useColorModeValue,
  IconButton,
  Button,
  Alert,
  AlertIcon,
  Divider
} from '@chakra-ui/react';
import { ChevronLeftIcon, LockIcon } from '@chakra-ui/icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useTopicStore from '../store/topicStore';
import useLessonStore from '../store/lessonStore';

const TopicDetailPage = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  
  const { topics, fetchAllTopics } = useTopicStore();
  const { 
    topicLessons, 
    fetchLessonsByTopic,
    isLoading,
    error
  } = useLessonStore();
  
  const [selectedTopic, setSelectedTopic] = useState(null);
  
  const bgGradient = useColorModeValue(
    'linear(to-b, blue.50, gray.50)',
    'linear(to-b, gray.900, gray.800)'
  );
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Lấy thông tin chủ đề và danh sách bài học khi component mount
  useEffect(() => {
    const loadData = async () => {
      // Nếu chưa có danh sách topics, lấy danh sách
      if (topics.length === 0) {
        await fetchAllTopics();
      }
      
      // Lấy danh sách bài học của chủ đề
      if (topicId) {
        await fetchLessonsByTopic(topicId);
      }
    };
    
    loadData();
  }, [topicId, fetchLessonsByTopic, fetchAllTopics, topics.length]);
  
  // Cập nhật thông tin chủ đề khi topics hoặc topicId thay đổi
  useEffect(() => {
    const topic = topics.find(t => t.topic_id.toString() === topicId);
    setSelectedTopic(topic);
  }, [topics, topicId]);
  
  // Xử lý điều hướng đến trang học
  const handleStartLesson = (lessonId) => {
    navigate(`/lessons/${lessonId}`);
  };
  
  // Xử lý quay lại
  const handleBack = () => {
    navigate('/learn');
  };
  
  // Kiểm tra xem bài học có bị khóa không
  const isLessonLocked = (index) => {
    if (index === 0) return false; // Bài đầu tiên không bị khóa
    
    // Kiểm tra xem bài học trước đó đã hoàn thành chưa
    const previousLesson = topicLessons[index - 1];
    return !previousLesson?.is_completed;
  };
  
  return (
    <Box
      pt="100px"
      pb="50px"
      minH="100vh"
      bgGradient={bgGradient}
    >
      <Container maxW="container.lg">
        <VStack spacing={6} align="stretch">
          {/* Nút quay lại và tiêu đề */}
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
          
          {/* Mô tả chủ đề */}
          {selectedTopic && (
            <Box 
              p={5} 
              bg="blue.50" 
              borderRadius="lg" 
              borderWidth="1px"
              borderColor="blue.200"
              mb={4}
            >
              <Text color="blue.700">{selectedTopic.description}</Text>
              
              {/* Tiến độ chủ đề */}
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
          
          {/* Thông báo lỗi */}
          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Text>{error}</Text>
            </Alert>
          )}
          
          {/* Danh sách bài học */}
          {isLoading ? (
            <Flex justify="center" py={10}>
              <Text>Đang tải bài học...</Text>
            </Flex>
          ) : (
            <VStack spacing={4} align="stretch">
              {topicLessons.map((lesson, index) => {
                const locked = isLessonLocked(index);
                return (
                  <Box
                    key={lesson.lesson_id}
                    position="relative"
                    bg={cardBg}
                    borderWidth="1px"
                    borderColor={locked ? 'gray.300' : lesson.is_completed ? 'green.300' : borderColor}
                    borderRadius="lg"
                    boxShadow={locked ? 'none' : 'md'}
                    overflow="hidden"
                    opacity={locked ? 0.7 : 1}
                    transition="all 0.2s"
                    cursor={locked ? 'not-allowed' : 'pointer'}
                    onClick={() => !locked && handleStartLesson(lesson.lesson_id)}
                    _hover={!locked && { transform: 'translateY(-2px)', boxShadow: 'lg' }}
                  >
                    <Flex p={0}>
                      {/* Phần bên trái - hình ảnh và số thứ tự */}
                      <Box 
                        bg={locked ? 'gray.200' : lesson.is_completed ? 'green.400' : 'blue.400'} 
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
                      
                      {/* Phần bên phải - thông tin bài học */}
                      <Box p={4} flex="1">
                        <VStack align="start" spacing={2}>
                          <Flex w="100%" justify="space-between" align="center">
                            <Heading size="md" fontWeight="semibold">
                              {lesson.title}
                            </Heading>
                            {lesson.is_completed ? (
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
                          
                          <Flex w="100%" justify="space-between" fontSize="sm" color="gray.600">
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
                              colorScheme={lesson.is_completed ? "green" : "blue"} 
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
              })}
            </VStack>
          )}
          
          {/* Nút trở về */}
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