// src/components/TopicCard.jsx
import React, { useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Progress,
  useColorModeValue,
  HStack,
  VStack,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import useProgressStore from '../store/progressStore';

const TopicCard = ({ topic }) => {
  const navigate = useNavigate();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const { topicProgress, fetchTopicsProgress } = useProgressStore();
  
  // Lấy tiến độ của chủ đề hiện tại
  const getTopicProgress = () => {
    if (!topicProgress || topicProgress.length === 0) return 0;
    
    const progress = topicProgress.find(p => p.topic_id === topic.topic_id);
    return progress ? progress.completed_percentage : 0;
  };
  
  // Đảm bảo topic có các thuộc tính cần thiết
  const topicData = {
    topic_id: topic.topic_id || 0,
    topic_name: topic.topic_name || topic.title || 'Chủ đề không tên',
    description: topic.description || 'Không có mô tả',
    // Ưu tiên lấy từ topic trước, nếu không có thì mới lấy từ topicProgress
    completed_percentage: topic.completed_percentage || getTopicProgress() || 0,
    completed_lessons: topic.completed_lessons || 0,
    total_lessons: topic.lesson_count || topic.total_lessons || 0,
    total_words: topic.total_words || topic.vocabulary_count || 0,
    total_memorized: topic.total_memorized || 0
  };
  
  // Lấy tiến độ chủ đề khi component mount
  useEffect(() => {
    // Chỉ fetch nếu chưa có dữ liệu
    if (topicProgress.length === 0) {
      fetchTopicsProgress().catch(console.error);
    }
  }, [fetchTopicsProgress, topicProgress.length]);
  
  const handleClick = () => {
    navigate(`/topics/${topicData.topic_id}`);
  };
  
  // Log để debug
  console.log('Topic data:', {
    id: topicData.topic_id,
    name: topicData.topic_name,
    progress: topicData.completed_percentage,
    origProgress: topic.completed_percentage
  });
  
  return (
    <Box
      as={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
      onClick={handleClick}
      cursor="pointer"
    >
      <Box
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        overflow="hidden"
        boxShadow="md"
        p={5}
        h="100%"
        display="flex"
        flexDirection="column"
        _hover={{ boxShadow: 'lg' }}
        transition="all 0.2s"
      >
        <VStack align="start" spacing={4} flex="1">
          <Heading size="md" color="flameo.500">
            {topicData.topic_name}
          </Heading>
          
          <Text noOfLines={2} fontSize="sm" color="gray.600" flex="1">
            {topicData.description}
          </Text>
          
          <Box w="100%">
            <HStack justify="space-between" mb={1}>
              <Text fontSize="sm" color="gray.500">Tiến độ chủ đề</Text>
              <Text fontSize="sm" fontWeight="bold">{topicData.completed_percentage}%</Text>
            </HStack>
            
            <Progress 
              value={topicData.completed_percentage} 
              colorScheme={topicData.completed_percentage >= 95 ? "green" : "blue"}
              size="sm" 
              borderRadius="full" 
            />
          </Box>
          
          <HStack justify="space-between" w="100%" fontSize="xs" color="gray.500">
            <Text>{topicData.completed_lessons || 0} / {topicData.total_lessons} bài học</Text>
            <Text>{topicData.total_memorized || 0}/{topicData.total_words} từ vựng</Text>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
};

export default TopicCard;