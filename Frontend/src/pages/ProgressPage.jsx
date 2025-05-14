import React, { useEffect } from 'react';
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
  Tabs
} from '@chakra-ui/react';
import useProgressStore  from '../store/progressStore';

// Component hiển thị biểu đồ
const ProgressChart = ({ title, value, max, color, icon }) => {
  const percentage = (value / max) * 100;
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
  const { 
    overallProgress, 
    topicProgress, 
    weeklyStats, 
    fetchAllProgress,
    isLoading
  } = useProgressStore();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgGradient = useColorModeValue(
    'linear(to-b, blue.50, gray.50)',
    'linear(to-b, gray.900, gray.800)'
  );
  
  useEffect(() => {
    fetchAllProgress();
  }, [fetchAllProgress]);
  
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
          
          {isLoading ? (
            <Flex justify="center" py={10}>
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
                        value={overallProgress.learned_words}
                        max={overallProgress.total_words}
                        color="blue.500"
                      />
                      
                      <ProgressChart
                        title="Từ vựng đã nhớ"
                        value={overallProgress.memorized_words}
                        max={overallProgress.learned_words}
                        color="green.500"
                      />
                      
                      <ProgressChart
                        title="Bài học hoàn thành"
                        value={overallProgress.completed_lessons}
                        max={overallProgress.total_lessons}
                        color="purple.500"
                      />
                    </SimpleGrid>
                    
                    {/* Thông tin chi tiết */}
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                      <Stat
                        bg={cardBg}
                        p={6}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor={borderColor}
                        boxShadow="md"
                      >
                        <StatLabel>Số ngày học liên tục</StatLabel>
                        <StatNumber>{overallProgress.streak_days} ngày</StatNumber>
                        <StatHelpText>Duy trì liên tục từ {overallProgress.streak_start_date}</StatHelpText>
                      </Stat>
                      
                      <Stat
                        bg={cardBg}
                        p={6}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor={borderColor}
                        boxShadow="md"
                      >
                        <StatLabel>Tổng thời gian học</StatLabel>
                        <StatNumber>{overallProgress.total_study_time} giờ</StatNumber>
                        <StatHelpText>Lần học gần nhất: {overallProgress.last_study_date}</StatHelpText>
                      </Stat>
                      
                      <Stat
                        bg={cardBg}
                        p={6}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor={borderColor}
                        boxShadow="md"
                      >
                        <StatLabel>Hiệu suất ghi nhớ</StatLabel>
                        <StatNumber>{overallProgress.memory_efficiency}%</StatNumber>
                        <StatHelpText>Tăng {overallProgress.memory_efficiency_change}% trong tuần qua</StatHelpText>
                      </Stat>
                    </SimpleGrid>
                  </VStack>
                </TabPanel>
                
                {/* Tab Chủ đề */}
                <TabPanel>
                  <VStack spacing={4} align="stretch">
                    {topicProgress.map(topic => (
                      <Box
                        key={topic.topic_id}
                        bg={cardBg}
                        p={5}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor={borderColor}
                        boxShadow="md"
                      >
                        <Flex justify="space-between" mb={2}>
                          <Heading size="sm">{topic.topic_name}</Heading>
                          <Text fontWeight="bold">{topic.completed_percentage}%</Text>
                        </Flex>
                        
                        <Progress
                          value={topic.completed_percentage}
                          colorScheme="blue"
                          size="sm"
                          borderRadius="full"
                          mb={3}
                        />
                        
                        <HStack fontSize="sm" color="gray.500" justify="space-between">
                          <Text>{topic.completed_lessons} / {topic.total_lessons} bài học</Text>
                          <Text>{topic.memorized_words} / {topic.total_words} từ vựng</Text>
                        </HStack>
                      </Box>
                    ))}
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
                        {weeklyStats.daily_words.map((day, index) => (
                          <Box key={index}>
                            <Flex justify="space-between" mb={1}>
                              <Text fontSize="sm">{day.date}</Text>
                              <Text fontSize="sm" fontWeight="bold">{day.count} từ</Text>
                            </Flex>
                            <Progress 
                              value={(day.count / weeklyStats.max_daily_words) * 100} 
                              colorScheme="blue" 
                              size="sm" 
                              borderRadius="full" 
                            />
                          </Box>
                        ))}
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
                      <Heading size="md" mb={4}>Thời gian học mỗi ngày</Heading>
                      <VStack spacing={3} align="stretch">
                        {weeklyStats.daily_time.map((day, index) => (
                          <Box key={index}>
                            <Flex justify="space-between" mb={1}>
                              <Text fontSize="sm">{day.date}</Text>
                              <Text fontSize="sm" fontWeight="bold">{day.minutes} phút</Text>
                            </Flex>
                            <Progress 
                              value={(day.minutes / weeklyStats.max_daily_time) * 100} 
                              colorScheme="green" 
                              size="sm" 
                              borderRadius="full" 
                            />
                          </Box>
                        ))}
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
                      <Heading size="md" mb={4}>Số từ đã nhớ theo loại</Heading>
                      <VStack spacing={3} align="stretch">
                        {weeklyStats.words_by_type.map((type, index) => (
                          <Box key={index}>
                            <Flex justify="space-between" mb={1}>
                              <Text fontSize="sm">{type.type}</Text>
                              <Text fontSize="sm" fontWeight="bold">{type.memorized} / {type.total}</Text>
                            </Flex>
                            <Progress 
                              value={(type.memorized / type.total) * 100} 
                              colorScheme="purple" 
                              size="sm" 
                              borderRadius="full" 
                            />
                          </Box>
                        ))}
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
                      <Heading size="md" mb={4}>Hiệu suất theo độ khó</Heading>
                      <VStack spacing={3} align="stretch">
                        {weeklyStats.efficiency_by_difficulty.map((diff, index) => (
                          <Box key={index}>
                            <Flex justify="space-between" mb={1}>
                              <Text fontSize="sm">{diff.difficulty}</Text>
                              <Text fontSize="sm" fontWeight="bold">{diff.efficiency}%</Text>
                            </Flex>
                            <Progress 
                              value={diff.efficiency} 
                              colorScheme={
                                diff.difficulty === 'Easy' ? 'green' :
                                diff.difficulty === 'Medium' ? 'yellow' : 'red'
                              }
                              size="sm" 
                              borderRadius="full" 
                            />
                          </Box>
                        ))}
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