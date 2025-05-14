import React, { useState } from 'react';
import {
  Box,
  Text,
  Heading,
  Button,
  VStack,
  HStack,
  Badge,
  IconButton,
  useColorModeValue,
  Flex,
  Divider
} from '@chakra-ui/react';
import { FaVolumeUp, FaCheck, FaTimes } from 'react-icons/fa';
import { motion } from 'framer-motion';

const FlashCard = ({ 
  vocabulary, 
  onMarkMemorized, 
  onMarkNotMemorized,
  onNext,
  onPrevious,
  showControls = true
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Xử lý lật thẻ
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };
  
  // Xử lý phát âm
  const playAudio = (e) => {
    e.stopPropagation(); // Ngăn sự kiện click lan đến thẻ (không lật thẻ)
    
    if (vocabulary.audio) {
      const audio = new Audio(vocabulary.audio);
      audio.play();
    }
  };
  
  // Xử lý đánh dấu đã nhớ
  const handleMarkMemorized = (e) => {
    e.stopPropagation();
    onMarkMemorized(vocabulary.vocab_id);
  };
  
  // Xử lý đánh dấu chưa nhớ
  const handleMarkNotMemorized = (e) => {
    e.stopPropagation();
    onMarkNotMemorized(vocabulary.vocab_id);
  };
  
  // Đánh dấu màu cho độ khó
  const difficultyColor = {
    Easy: 'green',
    Medium: 'yellow',
    Hard: 'red'
  };
  
  return (
    <Box 
      as={motion.div}
      onClick={handleFlip}
      cursor="pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      w="100%"
      maxW="600px"
      mx="auto"
      perspective="1000px"
    >
      <Box
        as={motion.div}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5 }}
        transformStyle="preserve-3d"
        w="100%"
        h={{ base: "300px", md: "350px" }}
        position="relative"
      >
        {/* Mặt trước */}
        <Box
          position="absolute"
          w="100%"
          h="100%"
          backfaceVisibility="hidden"
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          boxShadow="md"
          p={6}
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          style={{ transform: "rotateY(0deg)" }}
        >
          <Flex justify="space-between" w="100%" mb={2}>
            <Badge colorScheme={difficultyColor[vocabulary.difficulty_level] || 'blue'}>
              {vocabulary.difficulty_level}
            </Badge>
            <Text fontSize="sm" color="gray.500">{vocabulary.word_type}</Text>
          </Flex>
          
          <VStack spacing={4} my={6} flex="1" justify="center">
            <Heading size="xl" textAlign="center">{vocabulary.word}</Heading>
            <IconButton
              icon={<FaVolumeUp />}
              aria-label="Phát âm"
              onClick={playAudio}
              colorScheme="blue"
              variant="ghost"
              size="lg"
            />
            <Text color="gray.500" fontSize="md">{vocabulary.pronunciation}</Text>
          </VStack>
          
          <Text fontSize="sm" color="gray.500" mt="auto">Nhấn để xem nghĩa</Text>
        </Box>
        
        {/* Mặt sau */}
        <Box
          position="absolute"
          w="100%"
          h="100%"
          backfaceVisibility="hidden"
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          boxShadow="md"
          p={6}
          display="flex"
          flexDirection="column"
          style={{ transform: "rotateY(180deg)" }}
        >
          <VStack spacing={4} align="start" h="100%">
            <HStack w="100%" justify="space-between">
              <Text fontSize="sm" color="gray.500">{vocabulary.word_type}</Text>
              <IconButton
                icon={<FaVolumeUp />}
                aria-label="Phát âm"
                onClick={playAudio}
                colorScheme="blue"
                variant="ghost"
                size="sm"
              />
            </HStack>
            
            <VStack spacing={3} w="100%" flex="1" justify="center">
              <Heading size="md" color="flameo.500" alignSelf="center" mb={2}>
                {vocabulary.word}
              </Heading>
              
              <Box w="100%">
                <Text fontWeight="bold" mb={1}>Nghĩa:</Text>
                <Text>{vocabulary.meaning}</Text>
              </Box>
              
              <Divider my={2} />
              
              <Box w="100%">
                <Text fontWeight="bold" mb={1}>Ví dụ:</Text>
                <Text fontStyle="italic">{vocabulary.example}</Text>
              </Box>
            </VStack>
            
            <Text fontSize="sm" color="gray.500" alignSelf="center" mt="auto">
              Nhấn để quay lại
            </Text>
          </VStack>
        </Box>
      </Box>
      
      {/* Các nút điều khiển */}
      {showControls && (
        <HStack spacing={4} mt={6} justify="center">
          <Button
            leftIcon={<FaTimes />}
            colorScheme="red"
            variant="outline"
            onClick={handleMarkNotMemorized}
            isDisabled={vocabulary.is_memorized === false}
          >
            Chưa nhớ
          </Button>
          
          <Button
            leftIcon={<FaCheck />}
            colorScheme="green"
            onClick={handleMarkMemorized}
            isDisabled={vocabulary.is_memorized === true}
          >
            Đã nhớ
          </Button>
        </HStack>
      )}
    </Box>
  );
};

export default FlashCard;