import React from 'react';
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
import { Link } from 'react-router-dom';

const TopicCard = ({ topic }) => {
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
      <Link to={`/topics/${topic.topic_id}`}>
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
              {topic.topic_name}
            </Heading>
            
            <Text noOfLines={2} fontSize="sm" color="gray.600" flex="1">
              {topic.description}
            </Text>
            
            <Box w="100%">
              <HStack justify="space-between" mb={1}>
                <Text fontSize="sm" color="gray.500">Tiến độ</Text>
                <Text fontSize="sm" fontWeight="bold">{topic.completed_percentage}%</Text>
              </HStack>
              
              <Progress 
                value={topic.completed_percentage} 
                colorScheme="blue" 
                size="sm" 
                borderRadius="full" 
              />
            </Box>
            
            <HStack justify="space-between" w="100%" fontSize="xs" color="gray.500">
              <Text>{topic.completed_lessons} / {topic.total_lessons} bài học</Text>
              <Text>{topic.vocabulary_count} từ vựng</Text>
            </HStack>
          </VStack>
        </Box>
      </Link>
    </Box>
  );
};

export default TopicCard;