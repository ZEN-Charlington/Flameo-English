// src/components/ReviewExercise.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  Text,
  Input,
  Button,
  Flex,
  useColorModeValue,
  useToast,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  Skeleton
} from '@chakra-ui/react';
import { FaVolumeUp } from 'react-icons/fa';
import useVocabularyStore from '../store/vocabularyStore';

// Component ReviewExercise chỉ quản lý logic bài tập
const ReviewExercise = ({ 
  vocabulary, 
  onComplete, 
  onMarkNotMemorized 
}) => {
  // State cho phần bài tập
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [exerciseType, setExerciseType] = useState('');
  const [choices, setChoices] = useState([]);
  const [selectedOption, setSelectedOption] = useState('');
  const [userMarkedNotMemorized, setUserMarkedNotMemorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const setupTimeoutRef = useRef(null);
  const toast = useToast();
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Thiết lập bài tập khi từ vựng thay đổi
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    
    // Reset state
    setUserAnswer('');
    setIsCorrect(null);
    setShowAnswer(false);
    setSelectedOption('');
    setUserMarkedNotMemorized(false);
    
    // Xóa timeout hiện tại nếu có
    if (setupTimeoutRef.current) {
      clearTimeout(setupTimeoutRef.current);
    }
    
    // Thiết lập bài tập mới nếu có dữ liệu
    if (vocabulary) {
      setupTimeoutRef.current = setTimeout(() => {
        setupExercise();
        if (isMounted) {
          setTimeout(() => setIsLoading(false), 300);
        }
      }, 500);
    }
    
    // Cleanup
    return () => {
      isMounted = false;
      if (setupTimeoutRef.current) {
        clearTimeout(setupTimeoutRef.current);
      }
    };
  }, [vocabulary]);
  
  // Thiết lập loại bài tập
  const setupExercise = async () => {
    if (!vocabulary) return;
    
    // Lấy lịch sử bài tập từ localStorage
    const storedExerciseTypes = localStorage.getItem('exerciseHistory');
    const exerciseHistory = storedExerciseTypes ? JSON.parse(storedExerciseTypes) : [];
    
    // Các loại bài tập có sẵn
    const types = ['fillBlank', 'listenType', 'multipleChoice'];
    
    // Lọc bỏ loại bài tập vừa dùng
    let availableTypes = types;
    if (exerciseHistory.length > 0) {
      availableTypes = types.filter(type => type !== exerciseHistory[0]);
    }
    
    // Loại bỏ bài tập nghe nếu không có file âm thanh
    if (!vocabulary.audio) {
      availableTypes = availableTypes.filter(type => type !== 'listenType');
    }
    
    // Chọn loại bài tập
    const randomType = availableTypes.length > 0 
      ? availableTypes[Math.floor(Math.random() * availableTypes.length)]
      : 'fillBlank';
    
    // Lưu vào lịch sử
    const newHistory = [randomType, ...exerciseHistory.slice(0, 2)];
    localStorage.setItem('exerciseHistory', JSON.stringify(newHistory));
    
    // Thiết lập loại
    setExerciseType(randomType);
    
    // Tạo lựa chọn cho bài trắc nghiệm
    if (randomType === 'multipleChoice') {
      await generateChoices();
    }
  };
  
  // Tạo gợi ý điền từ
  const createBlankWord = (word) => {
    if (!word) return '';
    
    const words = word.split(' ');
    const result = words.map(w => {
      if (w.length <= 1) return w;
      
      const firstChar = w.charAt(0);
      const lastChar = w.charAt(w.length - 1);
      
      let blank = firstChar;
      for (let i = 1; i < w.length - 1; i++) {
        blank += '_';
      }
      blank += lastChar;
      
      return blank;
    });
    
    return result.join(' ');
  };

  // Tạo các lựa chọn cho bài trắc nghiệm
  const generateChoices = async () => {
    try {
      if (!vocabulary || !vocabulary.vocab_id) {
        throw new Error('Không có thông tin từ vựng');
      }
      
      // Lấy các từ vựng tương tự để làm options
      const allVocabs = useVocabularyStore.getState().reviewVocabulary;
      
      // Sử dụng các từ vựng khác làm options nếu có đủ
      if (allVocabs && allVocabs.length >= 3) {
        const otherOptions = allVocabs.filter(opt => opt.vocab_id !== vocabulary.vocab_id);
        
        if (otherOptions.length >= 2) {
          const shuffledOptions = [...otherOptions].sort(() => Math.random() - 0.5);
          const wrongOptions = shuffledOptions.slice(0, 2).map(opt => ({
            id: opt.vocab_id,
            meaning: opt.meaning,
            isCorrect: false
          }));
          
          const allChoices = [
            { id: vocabulary.vocab_id, meaning: vocabulary.meaning, isCorrect: true },
            ...wrongOptions
          ];
          
          setChoices(allChoices.sort(() => Math.random() - 0.5));
          return;
        }
      }
      
      // Nếu không đủ options, lấy từ API
      const wordType = vocabulary.word_type || '';
      const similarWords = await useVocabularyStore.getState().fetchSimilarWords(
        vocabulary.vocab_id,
        wordType,
        5
      );
      
      if (similarWords && similarWords.length >= 2) {
        const wrongOptions = similarWords.slice(0, 2).map(word => ({
          id: word.vocab_id,
          meaning: word.meaning,
          isCorrect: false
        }));
        
        const allChoices = [
          { id: vocabulary.vocab_id, meaning: vocabulary.meaning, isCorrect: true },
          ...wrongOptions
        ];
        
        setChoices(allChoices.sort(() => Math.random() - 0.5));
      } else {
        // Fallback
        setChoices([
          { id: 'correct', meaning: vocabulary.meaning, isCorrect: true },
          { id: 'wrong1', meaning: `Một ${vocabulary.word_type || 'từ'} khác trong tiếng Anh`, isCorrect: false },
          { id: 'wrong2', meaning: `Một ý nghĩa khác trong tiếng Anh`, isCorrect: false }
        ].sort(() => Math.random() - 0.5));
      }
    } catch (error) {
      console.error('Lỗi khi tạo các lựa chọn:', error);
      // Fallback
      setChoices([
        { id: 'correct', meaning: vocabulary.meaning, isCorrect: true },
        { id: 'wrong1', meaning: `Một ý nghĩa khác trong tiếng Anh`, isCorrect: false },
        { id: 'wrong2', meaning: `Một khái niệm trong tiếng Anh`, isCorrect: false }
      ].sort(() => Math.random() - 0.5));
    }
  };
  
  // Phát âm thanh
  const playAudio = () => {
    if (vocabulary && vocabulary.audio) {
      const audio = new Audio(vocabulary.audio);
      audio.play();
    } else {
      toast({
        title: "Không có file âm thanh",
        status: "warning",
        duration: 2000,
        isClosable: true
      });
    }
  };
  
  // Kiểm tra câu trả lời
  const checkAnswer = () => {
    if (!userAnswer.trim() && exerciseType !== 'multipleChoice') {
      toast({
        title: "Vui lòng nhập đáp án",
        status: "warning",
        duration: 2000,
        isClosable: true
      });
      return;
    }
    
    if (exerciseType === 'multipleChoice' && !selectedOption) {
      toast({
        title: "Vui lòng chọn một đáp án",
        status: "warning",
        duration: 2000,
        isClosable: true
      });
      return;
    }
    
    let correct = false;
    
    if (exerciseType === 'multipleChoice') {
      const selected = choices.find(choice => choice.id.toString() === selectedOption);
      correct = selected && selected.isCorrect;
    } else {
      const cleanUserAnswer = userAnswer.trim().toLowerCase().replace(/\s+/g, '');
      const cleanCorrectAnswer = vocabulary.word.toLowerCase().replace(/\s+/g, '');
      correct = cleanUserAnswer === cleanCorrectAnswer;
    }
    
    setIsCorrect(correct);
    setShowAnswer(true);
    
    if (correct) {
      toast({
        title: "Chính xác!",
        status: "success",
        duration: 1500,
        isClosable: true
      });
    } else {
      toast({
        title: "Chưa chính xác!",
        status: "error",
        duration: 2000,
        isClosable: true
      });
    }
  };
  
  // Reset bài tập
  const resetExercise = () => {
    setUserAnswer('');
    setIsCorrect(null);
    setShowAnswer(false);
    setSelectedOption('');
    setUserMarkedNotMemorized(false);
  };
  
  // Xử lý khi người dùng đã chọn kết quả và muốn tiếp tục
  const handleNext = () => {
    const isLastWord = useVocabularyStore.getState().currentVocabIndex >= 
                        useVocabularyStore.getState().reviewVocabulary.length - 1;
    
    // Gọi các callback để cập nhật trạng thái từ vựng
    if (userMarkedNotMemorized) {
      if (typeof onMarkNotMemorized === 'function') {
        onMarkNotMemorized(vocabulary.vocab_id, isLastWord);
      }
    } else if (isCorrect) {
      if (typeof onComplete === 'function') {
        onComplete(vocabulary.vocab_id, true, isLastWord);
      }
    } else {
      if (typeof onComplete === 'function') {
        onComplete(vocabulary.vocab_id, false, isLastWord);
      }
    }
    
    if (!isLastWord) {
      // Nếu không phải từ cuối, reset trạng thái
      resetExercise();
    }
  };
  
  // Xử lý khi người dùng không thuộc từ
  const handleMarkNotMemorized = () => {
    setUserMarkedNotMemorized(true);
    setIsCorrect(false);
    setShowAnswer(true);
    // Không gọi onMarkNotMemorized tại đây, chỉ gọi khi nhấn "Tiếp theo"/"Hoàn thành"
  };
  
  // Highlight từ cần học trong ví dụ
  const highlightWordInExample = (example, word) => {
    if (!example || !word) return example;
    
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (!regex.test(example)) return example;
    
    const parts = example.split(regex);
    return parts.map((part, index) => (
      <React.Fragment key={index}>
        {index > 0 && <Text as="span" fontWeight="bold" textDecoration="underline">{example.match(regex)[index - 1]}</Text>}
        {part}
      </React.Fragment>
    ));
  };
  
  // Render nội dung bài tập
  const renderExerciseContent = () => {
    if (isLoading) {
      return (
        <Box minH="300px">
          <Skeleton height="20px" my={2} width="80%" />
          <Skeleton height="30px" my={2} />
          <Skeleton height="20px" my={2} width="60%" />
          <Skeleton height="45px" my={4} />
        </Box>
      );
    }

    // Không hiển thị nội dung bài tập khi người dùng đã chọn "Không thuộc từ"
    if (showAnswer && userMarkedNotMemorized) {
      return null;
    }

    switch (exerciseType) {
      case 'fillBlank':
        return (
          <>
            <Box>
              <Text fontSize="sm" color="gray.500" mb={1}>Điền từ thích hợp có nghĩa:</Text>
              <Text fontSize="xl" fontWeight="bold" mb={4}>{vocabulary.meaning}</Text>
              
              <Text fontSize="sm" color="gray.500" mb={1}>Gợi ý:</Text>
              <Text fontSize="lg" letterSpacing={1} mb={4}>{createBlankWord(vocabulary.word)}</Text>
              
              <Input
                placeholder="Nhập từ tiếng Anh..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
                size="lg"
                borderColor={
                  isCorrect === null ? borderColor :
                  isCorrect ? 'green.300' : 'red.300'
                }
                mb={2}
                isDisabled={showAnswer}
              />
            </Box>
          </>
        );
        
      case 'listenType':
        return (
          <>
            <Box textAlign="center" mb={4}>
              <Text fontSize="lg" fontWeight="medium" mb={4}>
                Nghe và nhập từ bạn nghe được
              </Text>
              
              <IconButton
                icon={<FaVolumeUp size="24px" />}
                aria-label="Phát âm"
                size="lg"
                colorScheme="blue"
                onClick={playAudio}
                borderRadius="full"
                w="60px"
                h="60px"
                mb={4}
              />
              
              <Input
                placeholder="Nhập từ tiếng Anh..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
                size="lg"
                borderColor={
                  isCorrect === null ? borderColor :
                  isCorrect ? 'green.300' : 'red.300'
                }
                mb={2}
                isDisabled={showAnswer}
              />
            </Box>
          </>
        );
        
      case 'multipleChoice':
        return (
          <>
            <Box mb={4}>
              <Text fontSize="sm" color="gray.500" mb={1}>Ví dụ:</Text>
              <Text fontSize="lg" mb={4}>
                {highlightWordInExample(vocabulary.example, vocabulary.word)}
              </Text>
              
              <Text fontSize="md" fontWeight="medium" mb={3}>
                Hãy chọn nghĩa của từ được gạch chân:
              </Text>
              
              <RadioGroup 
                value={selectedOption} 
                onChange={setSelectedOption}
                colorScheme="blue"
                isDisabled={showAnswer}
              >
                <Stack spacing={3}>
                  {choices.map((choice) => (
                    <Radio 
                      key={choice.id} 
                      value={choice.id.toString()}
                      borderColor={
                        isCorrect === null ? borderColor :
                        choice.isCorrect ? 'green.400' : 
                        selectedOption === choice.id.toString() && !choice.isCorrect ? 'red.400' : borderColor
                      }
                    >
                      <Text>{choice.meaning}</Text>
                    </Radio>
                  ))}
                </Stack>
              </RadioGroup>
            </Box>
          </>
        );
        
      default:
        return null;
    }
  };
  
  // Hiển thị thông tin từ
  const renderVocabDetails = () => {
    if (!showAnswer) return null;
    
    const bgColor = isCorrect ? "green.50" : "red.50";
    const borderColor = isCorrect ? "green.200" : "red.200";
    const darkBgColor = isCorrect ? 'green.900' : 'red.900';
    const darkBorderColor = isCorrect ? 'green.700' : 'red.700';

    const bgNotMemorized = userMarkedNotMemorized ? "red.100" : bgColor;
    const borderNotMemorized = userMarkedNotMemorized ? "red.300" : borderColor;
    const darkBgNotMemorized = userMarkedNotMemorized ? 'red.800' : darkBgColor;
    const darkBorderNotMemorized = userMarkedNotMemorized ? 'red.600' : darkBorderColor;
    
    return (
      <Box 
        mt={4} 
        p={4} 
        bg={bgNotMemorized}
        borderRadius="md" 
        borderWidth="1px"
        borderColor={borderNotMemorized}
        _dark={{ 
          bg: darkBgNotMemorized, 
          borderColor: darkBorderNotMemorized
        }}
      >
        <Flex direction="column" spacing={2}>
          <Flex align="center" justify="space-between" mb={2}>
            <Text fontWeight="bold" fontSize="xl">{vocabulary.word}</Text>
            
            {vocabulary.audio && (
              <IconButton
                icon={<FaVolumeUp />}
                size="sm"
                colorScheme={userMarkedNotMemorized ? "red" : "blue"}
                onClick={playAudio}
                aria-label="Phát âm"
              />
            )}
          </Flex>
          
          <Text fontSize="md" fontWeight="medium" mb={1}>
            {vocabulary.meaning}
          </Text>
          
          {vocabulary.word_type && (
            <Text fontSize="sm" color="gray.500" mb={1}>
              Loại từ: {vocabulary.word_type}
            </Text>
          )}
          
          {vocabulary.example && (
            <Box mt={2}>
              <Text fontSize="sm" color="gray.500">Ví dụ:</Text>
              <Text fontSize="md" fontStyle="italic" mt={1}>
                {highlightWordInExample(vocabulary.example, vocabulary.word)}
              </Text>
            </Box>
          )}
        </Flex>
      </Box>
    );
  };
  
  if (!vocabulary) return null;
  
  // Public API của component
  return (
    <VStack spacing={6} align="stretch" h="100%">
      {renderExerciseContent()}
      
      {renderVocabDetails()}
      
      <Flex justify="flex-end" mt="auto">
        {!showAnswer ? (
          <>
            <Button 
              colorScheme="red" 
              variant="outline"
              onClick={handleMarkNotMemorized}
              isDisabled={isLoading}
              mr="auto"
            >
              Không thuộc từ này
            </Button>
            
            <Button 
              colorScheme="blue"
              onClick={checkAnswer}
              isDisabled={
                isLoading ||
                (exerciseType !== 'multipleChoice' && !userAnswer.trim()) ||
                (exerciseType === 'multipleChoice' && !selectedOption)
              }
            >
              Kiểm tra
            </Button>
          </>
        ) : (
          <Button 
            colorScheme="green"
            onClick={handleNext}
          >
            {useVocabularyStore.getState().currentVocabIndex >= useVocabularyStore.getState().reviewVocabulary.length - 1 
              ? "Hoàn thành" 
              : "Tiếp theo"}
          </Button>
        )}
      </Flex>
    </VStack>
  );
};

export default ReviewExercise;