import React, { useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Progress,
  Badge,
  useColorModeValue,
  Flex,
  VStack,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import useProgressStore from '../store/progressStore';

const LessonCard = ({ lesson }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const { completedLessons, fetchCompletedLessons } = useProgressStore();
  
  // Kiểm tra xem bài học đã hoàn thành chưa
  const isCompleted = () => {
    return completedLessons.some(l => 
      l.lesson_id === lesson.lesson_id && l.is_completed === 1
    );
  };
  
  // Lấy danh sách bài học đã hoàn thành khi component mount
  useEffect(() => {
    // Chỉ fetch nếu chưa có dữ liệu
    if (completedLessons.length === 0) {
      fetchCompletedLessons().catch(console.error);
    }
  }, [fetchCompletedLessons, completedLessons.length]);
  
  // Đảm bảo lesson có các thuộc tính cần thiết
  const lessonData = {
    lesson_id: lesson.lesson_id || 0,
    title: lesson.title || 'Bài học không tên',
    total_words: lesson.total_words || 0,
    completed_percentage: lesson.completed_percentage || 0,
    is_completed: isCompleted(),
    last_studied: lesson.last_review_date || lesson.completion_date || new Date().toISOString()
  };
  
  return (
    <Box
      as={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <Link to={`/lessons/${lessonData.lesson_id}`}>
        <Box
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          overflow="hidden"
          boxShadow="md"
          p={4}
          _hover={{ boxShadow: 'lg' }}
          transition="all 0.2s"
        >
          <VStack align="start" spacing={3}>
            <Heading size="md" mb={2}>
              {lessonData.title}
            </Heading>
            
            <Flex justify="space-between" align="center" w="100%">
              <Text fontSize="sm" color="gray.500">
                {lessonData.total_words} từ vựng
              </Text>
              
              {lessonData.is_completed ? (
                <Badge colorScheme="green">Hoàn thành</Badge>
              ) : (
                <Badge colorScheme="blue">Đang học</Badge>
              )}
            </Flex>
            
            <Box w="100%">
              <Flex justify="space-between" mb={1}>
                <Text fontSize="sm" color="gray.500">Tiến độ</Text>
                <Text fontSize="sm" fontWeight="bold">{lessonData.completed_percentage}%</Text>
              </Flex>
              
              <Progress 
                value={lessonData.completed_percentage} 
                colorScheme={lessonData.is_completed ? "green" : "blue"} 
                size="sm" 
                borderRadius="full" 
              />
            </Box>
            
            <Text fontSize="xs" color="gray.500">
              Cập nhật: {new Date(lessonData.last_studied).toLocaleDateString()}
            </Text>
          </VStack>
        </Box>
      </Link>
    </Box>
  );
};

export default LessonCard;