// src/components/ReviewExercise.jsx 
import React, { useState, useEffect } from 'react';
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
  Divider
} from '@chakra-ui/react';
import { FaVolumeUp } from 'react-icons/fa';
import axiosClient from '../api/axiosClient';

const ReviewExercise = ({ vocabulary, onComplete, onMarkNotMemorized, options }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [exerciseType, setExerciseType] = useState(''); // 'fillBlank', 'listenType', 'multipleChoice'
  const [choices, setChoices] = useState([]);
  const [selectedOption, setSelectedOption] = useState('');
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  useEffect(() => {
    // Biến để theo dõi cleanup
    let isMounted = true;
    let audioTimeout;
    
    const setupExercise = async () => {
      if (!vocabulary) return;
      
      // Reset state khi vocabulary thay đổi
      if (isMounted) {
        setUserAnswer('');
        setIsCorrect(null);
        setShowAnswer(false);
        setSelectedOption('');
        
        // Lấy loại bài tập hiện tại từ localStorage nếu có
        const storedExerciseTypes = localStorage.getItem('exerciseHistory');
        const exerciseHistory = storedExerciseTypes ? JSON.parse(storedExerciseTypes) : [];
        
        // Tạo danh sách các loại bài tập
        const types = ['fillBlank', 'listenType', 'multipleChoice'];
        
        // Lọc ra các loại bài tập chưa sử dụng gần đây
        let availableTypes = types;
        
        if (exerciseHistory.length > 0) {
          // Loại bỏ loại bài tập gần nhất (đã sử dụng)
          availableTypes = types.filter(type => type !== exerciseHistory[0]);
        }
        
        // Nếu không có audio, loại bỏ listenType khỏi các lựa chọn
        if (!vocabulary.audio) {
          availableTypes = availableTypes.filter(type => type !== 'listenType');
        }
        
        // Nếu không còn loại nào khác, sử dụng fillBlank làm mặc định
        const randomType = availableTypes.length > 0 
          ? availableTypes[Math.floor(Math.random() * availableTypes.length)]
          : 'fillBlank';
        
        // Lưu loại bài tập vào localStorage để tránh lặp lại
        const newHistory = [randomType, ...exerciseHistory.slice(0, 2)];
        localStorage.setItem('exerciseHistory', JSON.stringify(newHistory));
        
        // Thiết lập loại bài tập
        setExerciseType(randomType);
        
        // Nếu là bài tập trắc nghiệm, tạo các lựa chọn
        if (randomType === 'multipleChoice') {
          await generateChoices();
        }
        
        // Nếu là bài nghe, tự động phát âm sau một khoảng thời gian ngắn
        if (randomType === 'listenType' && vocabulary.audio) {
          // Tăng độ trễ lên để người dùng chuẩn bị
          const audioDelay = 1500; // 1.5 giây
          audioTimeout = setTimeout(() => {
            if (isMounted) playAudio();
          }, audioDelay);
        }
      }
    };
    
    // Gọi hàm thiết lập
    setupExercise();
    
    // Cleanup
    return () => {
      isMounted = false;
      if (audioTimeout) clearTimeout(audioTimeout);
    };
  }, [vocabulary]); // Chỉ phụ thuộc vào vocabulary
  
  // Tạo chuỗi gợi ý với chữ cái đầu và cuối của từ
  const createBlankWord = (word) => {
    if (!word) return '';
    
    const words = word.split(' ');
    
    // Xử lý từng từ trong cụm từ
    const result = words.map(w => {
      if (w.length <= 1) return w;
      
      const firstChar = w.charAt(0);
      const lastChar = w.charAt(w.length - 1);
      
      // Tạo dấu gạch dưới (_) theo độ dài từ, giữ lại chữ cái đầu và cuối
      let blank = firstChar;
      for (let i = 1; i < w.length - 1; i++) {
        blank += '_';
      }
      blank += lastChar;
      
      return blank;
    });
    
    return result.join(' ');
  };

  // Luôn lấy từ cơ sở dữ liệu để tránh lỗi khi chỉ còn 1 từ
  const generateChoices = async () => {
    try {
      // Luôn lấy các từ có cùng loại từ từ cơ sở dữ liệu để có lựa chọn đa dạng
      console.log("Tạo các lựa chọn cho từ:", vocabulary?.word, "Loại từ:", vocabulary?.word_type);
      
      const response = await axiosClient.get(`/similar-words?word_type=${vocabulary?.word_type || 'noun'}&vocab_id=${vocabulary?.vocab_id || 0}`);
      
      if (response.data && response.data.data && response.data.data.length >= 2) {
        // Lấy các từ có cùng loại từ làm đáp án sai
        const similarWords = response.data.data;
        console.log("Lấy được các từ tương tự:", similarWords.length);
        
        // Lấy 2 từ đầu tiên làm đáp án sai
        const wrongOptions = similarWords.slice(0, 2).map(word => ({
          id: word.vocab_id,
          meaning: word.meaning,
          isCorrect: false
        }));
        
        // Tạo mảng lựa chọn bao gồm đáp án đúng và các đáp án sai
        const allChoices = [
          { id: vocabulary.vocab_id, meaning: vocabulary.meaning, isCorrect: true },
          ...wrongOptions
        ];
        
        // Xáo trộn mảng lựa chọn
        setChoices(allChoices.sort(() => Math.random() - 0.5));
      } else {
        console.log("Không lấy được từ tương tự từ API, sử dụng lựa chọn dự phòng");
        
        // Nếu không lấy được từ cơ sở dữ liệu, kiểm tra xem có đủ từ trong options không
        if (options && options.length >= 3) {
          // Lấy ngẫu nhiên 2 từ vựng khác để làm đáp án sai
          let wrongOptions = [];
          const otherOptions = options.filter(opt => opt.vocab_id !== vocabulary.vocab_id);
          
          // Xáo trộn mảng để chọn ngẫu nhiên
          const shuffledOptions = [...otherOptions].sort(() => Math.random() - 0.5);
          
          // Lấy 2 từ đầu tiên làm đáp án sai
          wrongOptions = shuffledOptions.slice(0, 2).map(opt => ({
            id: opt.vocab_id,
            meaning: opt.meaning,
            isCorrect: false
          }));
          
          // Tạo mảng lựa chọn bao gồm đáp án đúng và các đáp án sai
          const allChoices = [
            { id: vocabulary.vocab_id, meaning: vocabulary.meaning, isCorrect: true },
            ...wrongOptions
          ];
          
          // Xáo trộn mảng lựa chọn
          setChoices(allChoices.sort(() => Math.random() - 0.5));
        } else {
          // Nếu không lấy được từ cơ sở dữ liệu và không đủ lựa chọn, tạo các lựa chọn thay thế
          setChoices([
            { id: 'correct', meaning: vocabulary.meaning, isCorrect: true },
            { id: 'wrong1', meaning: `Một ${vocabulary.word_type || 'từ'} khác trong tiếng Anh`, isCorrect: false },
            { id: 'wrong2', meaning: `Một ý nghĩa khác trong tiếng Anh`, isCorrect: false }
          ].sort(() => Math.random() - 0.5));
        }
      }
    } catch (error) {
      console.error('Error generating choices:', error);
      // Nếu có lỗi, tạo các lựa chọn thay thế với ý nghĩa chung chung
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
  
  // Kiểm tra câu trả lời - bài tập điền từ và nghe điền
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
      // Tìm lựa chọn được chọn
      const selected = choices.find(choice => choice.id.toString() === selectedOption);
      correct = selected && selected.isCorrect;
    } else {
      // So sánh đáp án không phân biệt chữ hoa/thường và loại bỏ khoảng trắng đối với bài nghe
      const cleanUserAnswer = userAnswer.trim().toLowerCase().replace(/\s+/g, '');
      const cleanCorrectAnswer = vocabulary.word.toLowerCase().replace(/\s+/g, '');
      correct = cleanUserAnswer === cleanCorrectAnswer;
    }
    
    setIsCorrect(correct);
    setShowAnswer(true); // Hiển thị đáp án luôn, bất kể đúng hay sai
    
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
  
  // Reset exercise cho từ mới
  const resetExercise = () => {
    setUserAnswer('');
    setIsCorrect(null);
    setShowAnswer(false);
    setSelectedOption('');
  };
  
  // Người dùng xác nhận đã hiểu và muốn chuyển sang từ tiếp theo
  const handleNext = () => {
    onComplete(vocabulary.vocab_id, isCorrect);
    resetExercise();
  };
  
  // Tìm vị trí của từ cần gạch chân trong ví dụ
  const highlightWordInExample = (example, word) => {
    if (!example || !word) return example;
    
    // Kiểm tra xem từ có trong ví dụ không
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (!regex.test(example)) return example;
    
    // Chia ví dụ thành các phần và thêm gạch chân vào từ cần highlight
    const parts = example.split(regex);
    return parts.map((part, index) => (
      <React.Fragment key={index}>
        {index > 0 && <Text as="span" fontWeight="bold" textDecoration="underline">{example.match(regex)[index - 1]}</Text>}
        {part}
      </React.Fragment>
    ));
  };
  
  // Render nội dung dựa trên loại bài tập
  const renderExerciseContent = () => {
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
                _focus={{
                  borderColor: isCorrect === null ? 'blue.300' :
                              isCorrect ? 'green.300' : 'red.300'
                }}
                _dark={{
                  borderColor: isCorrect === null ? 'gray.600' :
                             isCorrect ? 'green.500' : 'red.500',
                  _focus: {
                    borderColor: isCorrect === null ? 'blue.500' :
                                isCorrect ? 'green.500' : 'red.500'
                  }
                }}
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
                _focus={{
                  borderColor: isCorrect === null ? 'blue.300' :
                              isCorrect ? 'green.300' : 'red.300'
                }}
                _dark={{
                  borderColor: isCorrect === null ? 'gray.600' :
                             isCorrect ? 'green.500' : 'red.500',
                  _focus: {
                    borderColor: isCorrect === null ? 'blue.500' :
                                isCorrect ? 'green.500' : 'red.500'
                  }
                }}
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
                      _checked={{
                        bg: isCorrect === null ? 'blue.400' :
                            choice.isCorrect ? 'green.400' : 'red.400',
                        borderColor: isCorrect === null ? 'blue.500' :
                                  choice.isCorrect ? 'green.500' : 'red.500'
                      }}
                      _dark={{
                        borderColor: isCorrect === null ? 'gray.500' :
                                    choice.isCorrect ? 'green.500' : 
                                    selectedOption === choice.id.toString() && !choice.isCorrect ? 'red.500' : 'gray.600',
                        _checked: {
                          bg: isCorrect === null ? 'blue.600' :
                              choice.isCorrect ? 'green.600' : 'red.600',
                          borderColor: isCorrect === null ? 'blue.600' :
                                      choice.isCorrect ? 'green.600' : 'red.600'
                        }
                      }}
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
  
  // Hiển thị thông tin từ vựng (cả khi trả lời đúng hoặc sai)
  const renderVocabDetails = () => {
    if (!showAnswer) return null;
    
    return (
      <Box 
        mt={4} 
        p={4} 
        bg={isCorrect ? "green.50" : "blue.50"} 
        borderRadius="md" 
        borderWidth="1px"
        borderColor={isCorrect ? "green.200" : "blue.200"}
        _dark={{ 
          bg: isCorrect ? 'green.900' : 'blue.900', 
          borderColor: isCorrect ? 'green.700' : 'blue.700' 
        }}
      >
        <VStack align="start" spacing={2}>
          <Text fontWeight="bold" fontSize="lg">{vocabulary.word}</Text>
          
          {vocabulary.pronunciation && (
            <Flex align="center">
              <Text fontStyle="italic" mr={2}>/{vocabulary.pronunciation}/</Text>
              <IconButton
                icon={<FaVolumeUp />}
                size="sm"
                variant="ghost"
                colorScheme="blue"
                onClick={playAudio}
                aria-label="Phát âm"
              />
            </Flex>
          )}
          
          <Text fontWeight="bold" mt={1}>Loại từ:</Text>
          <Text>{vocabulary.word_type || "Không có thông tin"}</Text>
          
          <Text fontWeight="bold" mt={1}>Nghĩa:</Text>
          <Text>{vocabulary.meaning}</Text>
          
          {vocabulary.example && (
            <>
              <Text fontWeight="bold" mt={1}>Ví dụ:</Text>
              <Text fontStyle="italic">{vocabulary.example}</Text>
            </>
          )}
        </VStack>
      </Box>
    );
  };
  
  if (!vocabulary) return null;
  
  return (
    <Box
      p={6}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      bg={bgColor}
      boxShadow="md"
      w="100%"
      maxW="600px"
      mx="auto"
      _dark={{ bg: 'gray.800', borderColor: 'gray.700' }}
    >
      <VStack spacing={6} align="stretch">
        {renderExerciseContent()}
        
        {renderVocabDetails()}
        
        <Flex justify="space-between" mt={4}>
          <Button 
            colorScheme="gray" 
            variant="outline"
            onClick={() => onMarkNotMemorized(vocabulary.vocab_id)}
          >
            Không thuộc từ này
          </Button>
          
          {!showAnswer ? (
            <Button 
              colorScheme="blue"
              onClick={checkAnswer}
              isDisabled={
                (exerciseType !== 'multipleChoice' && !userAnswer.trim()) ||
                (exerciseType === 'multipleChoice' && !selectedOption)
              }
            >
              Kiểm tra
            </Button>
          ) : (
            <Button 
              colorScheme="green"
              onClick={handleNext}
            >
              Từ tiếp theo
            </Button>
          )}
        </Flex>
      </VStack>
    </Box>
  );
};

export default ReviewExercise;