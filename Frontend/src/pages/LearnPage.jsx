// src/pages/LearnPage.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Flex,
  useColorModeValue,
  Input,
  FormControl,
  FormLabel,
  Button,
  Alert,
  AlertIcon,
  Spinner
} from '@chakra-ui/react';
import TopicCard from '../components/TopicCard';
import useTopicStore from '../store/topicStore';

const LearnPage = () => {
  const { topics, fetchAllTopics, isLoadingTopics, error } = useTopicStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgGradient = useColorModeValue(
    'linear(to-b, blue.50, gray.50)',
    'linear(to-b, gray.900, gray.800)'
  );
  
  // Lấy dữ liệu khi component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchAllTopics();
      } catch (error) {
        console.error('Error loading learn page data:', error);
      }
    };
    
    loadData();
  }, [fetchAllTopics]);
  
  // Lọc chủ đề theo tên
  const filteredTopics = topics.filter(topic => 
    topic.topic_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const isLoading = isLoadingTopics;
  
  return (
    <Box
      pt="100px"
      pb="50px"
      minH="100vh"
      bgGradient={bgGradient}
    >
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          {/* Tiêu đề */}
          <Heading 
            textAlign="center"
            size="lg" 
            bgGradient="linear(to-r, blue.400, purple.500)" 
            bgClip="text"
          >
            Học từ mới
          </Heading>
          
          {/* Hiển thị lỗi nếu có */}
          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Text>{error}</Text>
            </Alert>
          )}
          
          {/* Bộ lọc */}
          <Box 
            bg={cardBg}
            p={5}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="md"
          >
            <Heading size="md" mb={4}>Tìm kiếm chủ đề</Heading>
            <Flex 
              direction={{ base: 'column', md: 'row' }}
              gap={4}
              align={{ md: 'flex-end' }}
            >
              <FormControl flex="1">
                <FormLabel>Từ khóa</FormLabel>
                <Input 
                  placeholder="Nhập tên chủ đề..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </FormControl>
              
              <Button 
                colorScheme="blue" 
                onClick={() => setSearchTerm('')}
              >
                Đặt lại
              </Button>
            </Flex>
          </Box>
          
          {/* Danh sách chủ đề */}
          <Box>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md">Danh sách chủ đề</Heading>
              <Text color="gray.500">{filteredTopics.length} chủ đề</Text>
            </Flex>
            
            {isLoadingTopics ? (
              <Flex justify="center" py={10}>
                <Spinner size="xl" color="blue.500" mr={2} />
                <Text>Đang tải chủ đề...</Text>
              </Flex>
            ) : filteredTopics.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {filteredTopics.map(topic => (
                  <TopicCard key={topic.topic_id} topic={topic} />
                ))}
              </SimpleGrid>
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
                <Text fontSize="lg" mb={4}>Không tìm thấy chủ đề nào</Text>
                <Button 
                  colorScheme="blue" 
                  onClick={() => setSearchTerm('')}
                >
                  Xem tất cả chủ đề
                </Button>
              </Flex>
            )}
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default LearnPage;