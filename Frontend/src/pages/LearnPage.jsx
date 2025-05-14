// src/pages/LearnPage.jsx (đã điều chỉnh)
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Button,
  Flex,
  useColorModeValue,
  Select,
  Input,
  FormControl,
  FormLabel,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
} from '@chakra-ui/react';
import FlashCard from '../components/FlashCard';
import TopicCard from '../components/TopicCard';
import useTopicStore from '../store/topicStore';
import useVocabularyStore from '../store/vocabularyStore';

const LearnPage = () => {
  const { topics, fetchAllTopics, isLoadingTopics } = useTopicStore();
  const { 
    newVocabulary, 
    fetchNewVocabulary, 
    currentVocabIndex,
    nextVocabulary,
    previousVocabulary,
    markVocabularyStatus,
    isLoading: isLoadingVocab 
  } = useVocabularyStore();
  
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgGradient = useColorModeValue(
    'linear(to-b, blue.50, gray.50)',
    'linear(to-b, gray.900, gray.800)'
  );
  
  // Lấy danh sách chủ đề
  useEffect(() => {
    fetchAllTopics();
  }, [fetchAllTopics]);
  
  // Lọc chủ đề theo tên
  const filteredTopics = topics.filter(topic => 
    topic.topic_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Xử lý khi chọn một chủ đề để học
  const handleSelectTopic = (topicId) => {
    setSelectedTopicId(topicId);
    fetchNewVocabulary(topicId);
    onOpen(); // Mở modal học từ vựng
  };
  
  // Xử lý đánh dấu từ vựng
  const handleMarkVocabulary = async (vocabId, isMemorized) => {
    await markVocabularyStatus(vocabId, isMemorized);
    // Tự động chuyển sang từ tiếp theo sau khi đánh dấu
    if (isMemorized) {
      setTimeout(() => {
        nextVocabulary();
      }, 500);
    }
  };
  
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
                <Text>Đang tải chủ đề...</Text>
              </Flex>
            ) : filteredTopics.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {filteredTopics.map(topic => (
                  <Box 
                    key={topic.topic_id}
                    onClick={() => handleSelectTopic(topic.topic_id)}
                    cursor="pointer"
                  >
                    <TopicCard topic={topic} />
                  </Box>
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
      
      {/* Modal học từ vựng */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxW="800px">
          <ModalHeader>
            {topics.find(t => t.topic_id.toString() === selectedTopicId.toString())?.topic_name || 'Học từ mới'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {isLoadingVocab ? (
              <Flex justify="center" py={10}>
                <Text>Đang tải từ vựng...</Text>
              </Flex>
            ) : newVocabulary.length > 0 ? (
              <VStack spacing={6}>
                <Flex w="100%" justify="space-between" align="center" mb={2}>
                  <Text>
                    {currentVocabIndex + 1} / {newVocabulary.length}
                  </Text>
                  <Button size="sm" onClick={onClose}>
                    Lưu và thoát
                  </Button>
                </Flex>
                
                {/* Flashcard từ vựng */}
                <FlashCard 
                  vocabulary={newVocabulary[currentVocabIndex]}
                  onMarkMemorized={(vocabId) => handleMarkVocabulary(vocabId, true)}
                  onMarkNotMemorized={(vocabId) => handleMarkVocabulary(vocabId, false)}
                  onNext={nextVocabulary}
                  onPrevious={previousVocabulary}
                />
              </VStack>
            ) : (
              <Flex direction="column" align="center" justify="center" py={6}>
                <Text fontSize="lg" mb={4}>Không có từ vựng nào trong chủ đề này</Text>
                <Button colorScheme="blue" onClick={onClose}>
                  Quay lại
                </Button>
              </Flex>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default LearnPage;