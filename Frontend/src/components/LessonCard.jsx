import React from 'react';
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

const LessonCard = ({ lesson }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box
      as={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <Link to={`/lessons/${lesson.lesson_id}`}>
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
              {lesson.title}
            </Heading>
            
            <Flex justify="space-between" align="center" w="100%">
              <Text fontSize="sm" color="gray.500">
                {lesson.vocabulary_count} từ vựng
              </Text>
              
              {lesson.is_completed ? (
                <Badge colorScheme="green">Hoàn thành</Badge>
              ) : (
                <Badge colorScheme="blue">Đang học</Badge>
              )}
            </Flex>
            
            <Box w="100%">
              <Flex justify="space-between" mb={1}>
                <Text fontSize="sm" color="gray.500">Tiến độ</Text>
                <Text fontSize="sm" fontWeight="bold">{lesson.completed_percentage}%</Text>
              </Flex>
              
              <Progress 
                value={lesson.completed_percentage} 
                colorScheme={lesson.is_completed ? "green" : "blue"} 
                size="sm" 
                borderRadius="full" 
              />
            </Box>
            
            <Text fontSize="xs" color="gray.500">
              Cập nhật: {new Date(lesson.last_studied || Date.now()).toLocaleDateString()}
            </Text>
          </VStack>
        </Box>
      </Link>
    </Box>
  );
};

export default LessonCard;