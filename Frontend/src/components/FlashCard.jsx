// Flashcard.jsx - Phiên bản cập nhật với hỗ trợ chế độ tối
import React, { useState } from 'react';
import {
  Box, Text, Heading, Button, VStack, HStack, IconButton, Center, Flex,
  useColorModeValue
} from '@chakra-ui/react';
import { FaVolumeUp } from 'react-icons/fa';
import ReactCardFlip from 'react-card-flip';

const FlashCard = ({ vocabulary, onMarkMemorized, onSkip }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Thêm các biến useColorModeValue để hỗ trợ chế độ tối
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardBorder = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.400', 'gray.500');
  const meaningBg = useColorModeValue('blue.50', 'blue.900');
  const meaningBorder = useColorModeValue('blue.200', 'blue.700');
  const meaningTextColor = useColorModeValue('blue.700', 'blue.200');
  const wordTypeBg = useColorModeValue('purple.100', 'purple.900');
  const wordTypeColor = useColorModeValue('purple.600', 'purple.300');

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handlePlayAudio = (e) => {
    e.stopPropagation();
    if (vocabulary.audio) {
      const audio = new Audio(vocabulary.audio);
      audio.play();
    }
  };

  return (
    <Center w="100%" py={4}>
      <Box w="100%" maxW="500px">
        <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal">
          {/* Mặt trước */}
          <Box
            key="front"
            onClick={handleFlip}
            cursor="pointer"
            bg={cardBg}
            border="1px solid"
            borderColor={cardBorder}
            borderRadius="xl"
            p={6}
            boxShadow="lg"
            h="360px"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
          >
            <Flex justifyContent="flex-end">
              <IconButton
                icon={<FaVolumeUp />}
                size="sm"
                variant="ghost"
                colorScheme="blue"
                onClick={handlePlayAudio}
                aria-label="Phát âm"
              />
            </Flex>

            <VStack spacing={3} flex="1" justifyContent="center">
              <Heading size="2xl">{vocabulary.word}</Heading>

              {vocabulary.pronunciation && (
                <Text fontSize="lg" color={textColor}>
                  /{vocabulary.pronunciation}/
                </Text>
              )}

              {vocabulary.example && (
                <Text fontSize="md" fontStyle="italic" textAlign="center">
                  {vocabulary.example}
                </Text>
              )}
            </VStack>

            <Text fontSize="sm" color={textColor} textAlign="center">
              Nhấn để xem nghĩa
            </Text>
          </Box>

          {/* Mặt sau */}
          <Box
            key="back"
            onClick={handleFlip}
            cursor="pointer"
            bg={cardBg}
            border="1px solid"
            borderColor={cardBorder}
            borderRadius="xl"
            p={6}
            boxShadow="lg"
            h="360px"
            display="flex"
            flexDirection="column"
            justifyContent="space-between"
          >
            <Flex justifyContent="flex-end">
              <IconButton
                icon={<FaVolumeUp />}
                size="sm"
                variant="ghost"
                colorScheme="blue"
                onClick={handlePlayAudio}
                aria-label="Phát âm"
              />
            </Flex>

            <VStack spacing={3} flex="1" justifyContent="center">
              <Heading size="2xl">{vocabulary.word}</Heading>

              <Box
                bg={meaningBg}
                borderRadius="md"
                px={4}
                py={2}
                border="1px solid"
                borderColor={meaningBorder}
              >
                <Text fontSize="lg" color={meaningTextColor} textAlign="center">
                  {vocabulary.meaning}
                </Text>
              </Box>

              {vocabulary.example && (
                <Text fontSize="md" fontStyle="italic" textAlign="center">
                  {vocabulary.example}
                </Text>
              )}

              {vocabulary.word_type && (
                <Text
                  fontSize="md"
                  fontWeight="bold"
                  color={wordTypeColor}
                  bg={wordTypeBg}
                  px={3}
                  py={2}
                  borderRadius="full"
                  display="inline-block"
                  mt={1}
                >
                  {vocabulary.word_type}
                </Text>
              )}
            </VStack>

            <Text fontSize="sm" color={textColor} textAlign="center">
              Nhấn để quay lại từ
            </Text>
          </Box>
        </ReactCardFlip>

        {/* Nút chức năng */}
        <HStack spacing={4} mt={6} justify="center">
          <Button
            size="lg"
            colorScheme="gray"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onSkip();
            }}
          >
            Bỏ qua
          </Button>
          <Button
            size="lg"
            colorScheme="green"
            onClick={(e) => {
              e.stopPropagation();
              onMarkMemorized(vocabulary.vocab_id);
            }}
          >
            Đã nhớ
          </Button>
        </HStack>
      </Box>
    </Center>
  );
};

export default FlashCard;