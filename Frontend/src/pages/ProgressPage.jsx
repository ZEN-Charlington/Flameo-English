// src/pages/ProgressPage.jsx (Fixed hooks order)
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  VStack,
  HStack,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  CircularProgress,
  CircularProgressLabel,
  useColorModeValue,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Spinner,
  Divider,
  Alert,
  AlertIcon,
  Badge,
  Card,
  CardHeader,
  CardBody
} from '@chakra-ui/react';
import { FaTrophy, FaBookOpen, FaBook, FaStar } from 'react-icons/fa';
import useProgressStore from '../store/progressStore';
import useVocabularyStore from '../store/vocabularyStore';

// Component hiển thị biểu đồ
const ProgressChart = ({ title, value, max, color, icon }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box
      bg={cardBg}
      p={6}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      boxShadow="md"
    >
      <VStack spacing={4} align="center">
        <Flex align="center">
          {icon && <Box mr={2}>{icon}</Box>}
          <Heading size="md">{title}</Heading>
        </Flex>
        
        <CircularProgress 
          value={percentage} 
          color={color} 
          size="120px" 
          thickness="8px"
        >
          <CircularProgressLabel>
            {Math.round(percentage)}%
          </CircularProgressLabel>
        </CircularProgress>
        
        <Text>
          {value} / {max}
        </Text>
      </VStack>
    </Box>
  );
};

const ProgressPage = () => {
  // ===== ALL HOOKS FIRST - KHÔNG ĐƯỢC THAY ĐỔI THỨ TỰ =====
  
  // Store hooks
  const { 
    overallProgress,
    topicProgress,
    completedLessons,
    vocabProgress,
    fetchAllProgress,
    isLoading: isProgressLoading,
    error: progressError
  } = useProgressStore();
  
  const {
    vocabularyStatsByType,
    fetchVocabularyStatsByType,
    isLoading: isVocabStatsLoading,
    error: vocabStatsError
  } = useVocabularyStore();
  
  // State hooks
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Color mode hooks - PHẢI Ở ĐẦU, KHÔNG ĐƯỢC ĐIỀU KIỆN
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgGradient = useColorModeValue(
    'linear(to-b, blue.50, gray.50)',
    'linear(to-b, gray.900, gray.800)'
  );
  const completedLessonBg = useColorModeValue('gray.50', 'gray.700');
  const completedLessonText = useColorModeValue('gray.500', 'gray.300');
  const grayText = useColorModeValue('gray.500', 'gray.400');
  
  // Effect hooks
  useEffect(() => {
    // Tải song song dữ liệu tiến độ và thống kê từ vựng theo loại
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Gọi cả hai API song song sử dụng Promise.all
        await Promise.all([
          fetchAllProgress(),
          fetchVocabularyStatsByType()
        ]);
      } catch (err) {
        console.error("Lỗi khi tải dữ liệu:", err);
        setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [fetchAllProgress, fetchVocabularyStatsByType]);
  
  // ===== COMPUTED VALUES & FUNCTIONS =====
  
  // Tạo dữ liệu thống kê theo ngày từ vocabProgress
  const createDailyStats = () => {
    if (!vocabProgress || vocabProgress.length === 0) {
      return [];
    }
    
    // Tạo map với key là ngày, value là số từ học trong ngày đó
    const dailyMap = {};
    
    vocabProgress.forEach(progress => {
      if (progress.last_review_date) {
        const date = new Date(progress.last_review_date).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        if (!dailyMap[date]) {
          dailyMap[date] = 0;
        }
        dailyMap[date]++;
      }
    });
    
    // Chuyển từ map sang mảng
    const result = Object.entries(dailyMap).map(([date, count]) => ({
      date,
      count
    }));
    
    // Sắp xếp theo ngày (mới nhất trước)
    result.sort((a, b) => new Date(b.date.split('/').reverse().join('/')) - new Date(a.date.split('/').reverse().join('/')));
    
    // Chỉ lấy 7 ngày gần nhất
    return result.slice(0, 7);
  };
  
  const dailyStats = createDailyStats();
  const maxDailyWords = dailyStats.length > 0 ? 
    Math.max(...dailyStats.map(day => day.count)) : 10;
  
  // ===== RENDER =====
  
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
            Tiến độ học tập
          </Heading>
          
          {/* Hiển thị lỗi nếu có */}
          {(progressError || vocabStatsError || error) && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Text>{progressError || vocabStatsError || error}</Text>
            </Alert>
          )}
          
          {isLoading || isProgressLoading || isVocabStatsLoading ? (
            <Flex justify="center" py={10}>
              <Spinner size="xl" color="blue.500" mr={2} />
              <Text>Đang tải dữ liệu tiến độ...</Text>
            </Flex>
          ) : (
            <Tabs colorScheme="blue" variant="enclosed">
              <TabList>
                <Tab>Tổng quan</Tab>
                <Tab>Chủ đề</Tab>
                <Tab>Thống kê</Tab>
              </TabList>
              
              <TabPanels>
                {/* Tab Tổng quan */}
                <TabPanel>
                  <VStack spacing={8} align="stretch">
                    {/* Tổng quan */}
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                      <ProgressChart
                        title="Từ vựng đã học"
                        value={overallProgress?.vocabulary?.total_learned || 0}
                        max={overallProgress?.vocabulary?.total || 1}
                        color="blue.500"
                        icon={<FaBookOpen />}
                      />
                      
                      <ProgressChart
                        title="Từ vựng đã nhớ"
                        value={overallProgress?.vocabulary?.total_memorized || 0}
                        max={overallProgress?.vocabulary?.total_learned || 1}
                        color="green.500"
                        icon={<FaStar />}
                      />
                      
                      <ProgressChart
                        title="Bài học hoàn thành"
                        value={overallProgress?.lessons?.completed || 0}
                        max={overallProgress?.lessons?.total || 1}
                        color="purple.500"
                        icon={<FaBook />}
                      />
                    </SimpleGrid>
                    
                    {/* Tiến độ tổng thể */}
                    <Card bg={cardBg} boxShadow="md">
                      <CardHeader pb={0}>
                        <Heading size="md">Tiến độ tổng thể</Heading>
                      </CardHeader>
                      <CardBody>
                        <HStack spacing={6} align="center">
                          <CircularProgress 
                            value={overallProgress?.overall_percentage || 0} 
                            color="blue.500" 
                            size="100px" 
                            thickness="10px"
                          >
                            <CircularProgressLabel>
                              {Math.round(overallProgress?.overall_percentage || 0)}%
                            </CircularProgressLabel>
                          </CircularProgress>
                          
                          <VStack align="start" spacing={2} flex="1">
                            <Box w="100%">
                              <Flex justify="space-between" mb={1}>
                                <Text>Từ vựng</Text>
                                <Text fontWeight="medium">{overallProgress?.vocabulary?.percentage || 0}%</Text>
                              </Flex>
                              <Progress 
                                value={overallProgress?.vocabulary?.percentage || 0}
                                colorScheme="blue"
                                size="sm"
                                borderRadius="full"
                              />
                            </Box>
                            
                            <Box w="100%">
                              <Flex justify="space-between" mb={1}>
                                <Text>Bài học</Text>
                                <Text fontWeight="medium">{overallProgress?.lessons?.percentage || 0}%</Text>
                              </Flex>
                              <Progress 
                                value={overallProgress?.lessons?.percentage || 0}
                                colorScheme="green"
                                size="sm"
                                borderRadius="full"
                              />
                            </Box>
                            
                            <Box w="100%">
                              <Flex justify="space-between" mb={1}>
                                <Text>Chủ đề</Text>
                                <Text fontWeight="medium">{overallProgress?.topics?.percentage || 0}%</Text>
                              </Flex>
                              <Progress 
                                value={overallProgress?.topics?.percentage || 0}
                                colorScheme="purple"
                                size="sm"
                                borderRadius="full"
                              />
                            </Box>
                          </VStack>
                        </HStack>
                      </CardBody>
                    </Card>
                    
                    {/* Bài học đã hoàn thành gần đây */}
                    <Card bg={cardBg} boxShadow="md">
                      <CardHeader pb={0}>
                        <Heading size="md">Bài học đã hoàn thành gần đây</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={2} align="stretch">
                          {completedLessons && completedLessons.length > 0 ? (
                            completedLessons.slice(0, 5).map(lesson => (
                              <Box key={lesson.lesson_id} p={2} borderRadius="md" bg={completedLessonBg}>
                                <Flex justify="space-between">
                                  <Text fontWeight="medium">{lesson.title}</Text>
                                  <Text fontSize="sm" color={completedLessonText}>
                                    {new Date(lesson.completion_date).toLocaleDateString('vi-VN', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })}
                                  </Text>
                                </Flex>
                              </Box>
                            ))
                          ) : (
                            <Text color={grayText}>
                              Bạn chưa hoàn thành bài học nào. Hãy bắt đầu học!
                            </Text>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  </VStack>
                </TabPanel>
                
                {/* Tab Chủ đề */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    {topicProgress && topicProgress.length > 0 ? (
                      topicProgress.map(topic => (
                        <Box
                          key={topic.topic_id}
                          bg={cardBg}
                          p={5}
                          borderRadius="lg"
                          borderWidth="1px"
                          borderColor={borderColor}
                          boxShadow="md"
                        >
                          <Flex justify="space-between" align="center" mb={2}>
                            <Heading size="sm">{topic.topic_name}</Heading>
                            <Badge 
                              colorScheme={topic.completed_percentage >= 95 ? "green" : "blue"}
                              p={1}
                              borderRadius="md"
                            >
                              {topic.completed_percentage}%
                            </Badge>
                          </Flex>
                          
                          <Progress
                            value={topic.completed_percentage}
                            colorScheme={topic.completed_percentage >= 95 ? "green" : "blue"}
                            size="sm"
                            borderRadius="full"
                            mb={3}
                          />
                          
                          <HStack fontSize="sm" color={grayText} justify="space-between">
                            <Text>{topic.completed_lessons} / {topic.total_lessons} bài học</Text>
                            <Divider orientation="vertical" h="20px" />
                            <Text>{topic.vocabulary_count || 0} từ vựng</Text>
                          </HStack>
                        </Box>
                      ))
                    ) : (
                      <Box 
                        bg={cardBg}
                        p={5}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor={borderColor}
                        boxShadow="md"
                        textAlign="center"
                      >
                        <Text color={grayText}>Chưa có dữ liệu tiến độ cho chủ đề nào.</Text>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>
                
                {/* Tab Thống kê */}
                <TabPanel>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                    <Box
                      bg={cardBg}
                      p={6}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={borderColor}
                      boxShadow="md"
                    >
                      <Heading size="md" mb={4}>Số từ học mỗi ngày</Heading>
                      <VStack spacing={3} align="stretch">
                        {dailyStats.length > 0 ? (
                          dailyStats.map((day, index) => (
                            <Box key={index}>
                              <Flex justify="space-between" mb={1}>
                                <Text fontSize="sm">{day.date}</Text>
                                <Text fontSize="sm" fontWeight="bold">{day.count} từ</Text>
                              </Flex>
                              <Progress 
                                value={(day.count / maxDailyWords) * 100} 
                                colorScheme="blue" 
                                size="sm" 
                                borderRadius="full" 
                              />
                            </Box>
                          ))
                        ) : (
                          <Text color={grayText}>Chưa có dữ liệu học tập theo ngày.</Text>
                        )}
                      </VStack>
                    </Box>
                    
                    <Box
                      bg={cardBg}
                      p={6}
                      borderRadius="lg"
                      borderWidth="1px"
                      borderColor={borderColor}
                      boxShadow="md"
                    >
                      <Heading size="md" mb={4}>Số từ đã thuộc theo loại</Heading>
                      <VStack spacing={3} align="stretch">
                        {vocabularyStatsByType && vocabularyStatsByType.length > 0 ? (
                          vocabularyStatsByType.map((typeData, index) => (
                            <Box key={index}>
                              <Flex justify="space-between" mb={1}>
                                <Text fontSize="sm">{typeData.type}</Text>
                                <Text fontSize="sm" fontWeight="bold">
                                  {typeData.memorized} / {typeData.total} từ
                                </Text>
                              </Flex>
                              <Progress 
                                value={(typeData.memorized / typeData.total) * 100} 
                                colorScheme="purple" 
                                size="sm" 
                                borderRadius="full" 
                              />
                            </Box>
                          ))
                        ) : (
                          <Text color={grayText}>Chưa có dữ liệu từ vựng theo loại.</Text>
                        )}
                      </VStack>
                    </Box>
                  </SimpleGrid>
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default ProgressPage;