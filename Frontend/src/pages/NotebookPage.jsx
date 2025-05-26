// src/pages/NotebookPage.jsx (Hoàn chỉnh)
import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  IconButton,
  Input,
  Flex,
  VStack,
  HStack,
  Badge,
  useColorModeValue,
  Select,
  InputGroup,
  InputLeftElement,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  StatHelpText
} from '@chakra-ui/react';
import { 
  SearchIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  RepeatIcon
} from '@chakra-ui/icons';
import { FaVolumeUp, FaStar, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import useVocabularyStore from '../store/vocabularyStore';

const NotebookPage = () => {
  const { 
    notebookVocabulary, 
    fetchNotebookVocabulary, 
    isLoading, 
    error,
    markVocabularyStatus
  } = useVocabularyStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedMemorized, setSelectedMemorized] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('word');
  const [sortDirection, setSortDirection] = useState('asc');
  
  const toast = useToast();
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tableBg = useColorModeValue('white', 'gray.900');
  const bgGradient = useColorModeValue(
    'linear(to-b, blue.50, gray.50)',
    'linear(to-b, gray.900, gray.800)'
  );
  const starColor = useColorModeValue('orange.400', 'yellow.400'); // Màu cho icon sao
  
  // Số từ vựng trên một trang
  const itemsPerPage = 10;
  
  useEffect(() => {
    // Lần đầu load trang, lấy dữ liệu từ vựng trong sổ tay
    fetchNotebookVocabulary();
  }, [fetchNotebookVocabulary]);
  
  // Lấy danh sách các loại từ duy nhất từ dữ liệu
  const uniqueWordTypes = useMemo(() => {
    if (!notebookVocabulary || notebookVocabulary.length === 0) {
      return [];
    }
    
    // Lọc các loại từ duy nhất và loại bỏ giá trị null/undefined/empty
    const types = notebookVocabulary
      .map(vocab => vocab.word_type)
      .filter(type => type && type.trim() !== '');
    
    // Sử dụng Set để loại bỏ trùng lặp, sau đó chuyển về mảng và sắp xếp
    const uniqueTypes = [...new Set(types)].sort();
    
    return uniqueTypes;
  }, [notebookVocabulary]);
  
  // Xử lý tìm kiếm và lọc
  const filteredVocabulary = notebookVocabulary ? notebookVocabulary.filter(vocab => {
    // Tìm kiếm theo từ hoặc nghĩa
    const matchesSearchTerm = vocab.word?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             vocab.meaning?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Lọc theo loại từ (từ danh sách động của database)
    // So sánh không phân biệt hoa thường vì dữ liệu có thể khác nhau
    const matchesType = selectedType === '' || 
                       (vocab.word_type && vocab.word_type.toLowerCase() === selectedType.toLowerCase());
    
    // Lọc theo độ khó
    const matchesDifficulty = selectedDifficulty === '' || 
                             vocab.difficulty_level === selectedDifficulty;
    
    // Lọc theo trạng thái học tập
    const matchesMemorized = selectedMemorized === '' || 
                            (selectedMemorized === 'memorized' && vocab.is_memorized === 1) ||
                            (selectedMemorized === 'not_memorized' && vocab.is_memorized === 0);
    
    return matchesSearchTerm && matchesType && matchesDifficulty && matchesMemorized;
  }) : [];
  
  // Xử lý sắp xếp
  const sortedVocabulary = [...filteredVocabulary].sort((a, b) => {
    const fieldA = a[sortField] || '';
    const fieldB = b[sortField] || '';
    
    if (typeof fieldA === 'string') {
      return sortDirection === 'asc' 
        ? fieldA.localeCompare(fieldB) 
        : fieldB.localeCompare(fieldA);
    } else {
      return sortDirection === 'asc' 
        ? fieldA - fieldB 
        : fieldB - fieldA;
    }
  });
  
  // Tính toán phân trang
  const totalPages = Math.max(1, Math.ceil(sortedVocabulary.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVocabulary = sortedVocabulary.slice(startIndex, startIndex + itemsPerPage);
  
  // Tính toán thống kê
  const calculateStats = () => {
    if (!notebookVocabulary || notebookVocabulary.length === 0) {
      return {
        total: 0,
        memorized: 0,
        notMemorized: 0,
        memorizedPercentage: 0
      };
    }
    
    const total = notebookVocabulary.length;
    const memorized = notebookVocabulary.filter(vocab => vocab.is_memorized === 1).length;
    const notMemorized = total - memorized;
    const memorizedPercentage = (memorized / total) * 100;
    
    return {
      total,
      memorized,
      notMemorized,
      memorizedPercentage
    };
  };
  
  const stats = calculateStats();
  
  // Xử lý thay đổi sắp xếp
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };
  
  // Xử lý phát âm
  const playAudio = (audio) => {
    if (audio) {
      const audioObj = new Audio(audio);
      audioObj.play();
    } else {
      toast({
        title: "Không có file âm thanh",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    }
  };
  
  // Xử lý đánh dấu từ vựng đã thuộc/chưa thuộc
  const handleToggleMemorized = async (vocabId, currentStatus) => {
    try {
      // Đảo ngược trạng thái hiện tại
      const newStatus = currentStatus === 1 ? 0 : 1;
      await markVocabularyStatus(vocabId, newStatus);
      
      toast({
        title: newStatus === 1 ? "Đã đánh dấu thuộc" : "Đã đánh dấu chưa thuộc",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật trạng thái từ vựng",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Xử lý làm mới dữ liệu
  const handleRefresh = () => {
    fetchNotebookVocabulary();
    toast({
      title: "Đã làm mới dữ liệu",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };
  
  // Render icon sắp xếp
  const renderSortIcon = (field) => {
    if (field !== sortField) {
      return <FaSort />;
    }
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
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
            Sổ tay từ vựng
          </Heading>
          
          {/* Thống kê */}
          {notebookVocabulary && notebookVocabulary.length > 0 && (
            <Box 
              bg={cardBg}
              p={5}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              boxShadow="md"
            >
              <Heading size="md" mb={4}>Thống kê học tập</Heading>
              
              <StatGroup>
                <Stat>
                  <StatLabel>Tổng số từ vựng</StatLabel>
                  <StatNumber>{stats.total}</StatNumber>
                </Stat>
                
                <Stat>
                  <StatLabel>Đã thuộc</StatLabel>
                  <StatNumber>{stats.memorized}</StatNumber>
                  <StatHelpText>
                    {stats.memorizedPercentage.toFixed(1)}%
                  </StatHelpText>
                </Stat>
                
                <Stat>
                  <StatLabel>Chưa thuộc</StatLabel>
                  <StatNumber>{stats.notMemorized}</StatNumber>
                  <StatHelpText>
                    {(100 - stats.memorizedPercentage).toFixed(1)}%
                  </StatHelpText>
                </Stat>
              </StatGroup>
            </Box>
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
            <Flex 
              direction={{ base: 'column', md: 'row' }}
              justify="space-between"
              gap={4}
              wrap="wrap"
            >
              <InputGroup maxW={{ md: '350px' }}>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input 
                  placeholder="Tìm kiếm từ vựng hoặc nghĩa..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              
              <HStack spacing={4} flexWrap="wrap">
                <Select 
                  placeholder="Loại từ" 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  size="md"
                  maxW="150px"
                >
                  {/* Hiển thị động các loại từ từ database */}
                  {uniqueWordTypes.map((type) => (
                    <option key={type} value={type.toLowerCase()}>
                      {type}
                    </option>
                  ))}
                  {uniqueWordTypes.length === 0 && (
                    <>
                      <option value="noun">Noun</option>
                      <option value="verb">Verb</option>
                      <option value="adjective">Adjective</option>
                      <option value="adverb">Adverb</option>
                    </>
                  )}
                </Select>
                
                <Select 
                  placeholder="Độ khó" 
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  size="md"
                  maxW="150px"
                >
                  <option value="Easy">Dễ</option>
                  <option value="Medium">Trung bình</option>
                  <option value="Hard">Khó</option>
                </Select>
                
                <Select 
                  placeholder="Trạng thái" 
                  value={selectedMemorized}
                  onChange={(e) => setSelectedMemorized(e.target.value)}
                  size="md"
                  maxW="150px"
                >
                  <option value="memorized">Đã thuộc</option>
                  <option value="not_memorized">Chưa thuộc</option>
                </Select>
                
                <IconButton
                  aria-label="Làm mới"
                  icon={<RepeatIcon />}
                  onClick={handleRefresh}
                  isLoading={isLoading}
                />
                
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedType('');
                    setSelectedDifficulty('');
                    setSelectedMemorized('');
                  }}
                  size="md"
                >
                  Đặt lại
                </Button>
              </HStack>
            </Flex>
          </Box>
          
          {/* Hiển thị lỗi nếu có */}
          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Text>{error}</Text>
            </Alert>
          )}
          
          {/* Bảng từ vựng */}
          {isLoading ? (
            <Flex justify="center" py={10}>
              <Spinner size="xl" color="blue.500" />
              <Text ml={4}>Đang tải từ vựng...</Text>
            </Flex>
          ) : filteredVocabulary.length > 0 ? (
            <Box 
              overflowX="auto"
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              boxShadow="md"
            >
              <Table variant="simple" bg={tableBg}>
                <Thead>
                  <Tr>
                    <Th 
                      cursor="pointer" 
                      onClick={() => handleSort('word')}
                      whiteSpace="nowrap"
                    >
                      <Flex align="center">
                        Từ vựng {renderSortIcon('word')}
                      </Flex>
                    </Th>
                    <Th 
                      cursor="pointer" 
                      onClick={() => handleSort('meaning')}
                    >
                      <Flex align="center">
                        Nghĩa {renderSortIcon('meaning')}
                      </Flex>
                    </Th>
                    <Th 
                      cursor="pointer" 
                      onClick={() => handleSort('word_type')}
                      whiteSpace="nowrap"
                    >
                      <Flex align="center">
                        Loại từ {renderSortIcon('word_type')}
                      </Flex>
                    </Th>
                    <Th 
                      cursor="pointer" 
                      onClick={() => handleSort('difficulty_level')}
                      whiteSpace="nowrap"
                    >
                      <Flex align="center">
                        Độ khó {renderSortIcon('difficulty_level')}
                      </Flex>
                    </Th>
                    <Th 
                      cursor="pointer" 
                      onClick={() => handleSort('is_memorized')}
                      whiteSpace="nowrap"
                    >
                      <Flex align="center">
                        Trạng thái {renderSortIcon('is_memorized')}
                      </Flex>
                    </Th>
                    <Th>Thao tác</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginatedVocabulary.map((vocab) => (
                    <Tr key={vocab.vocab_id}>
                      <Td>
                        <Text fontWeight="medium">{vocab.word}</Text>
                        <Text fontSize="xs" color="gray.500">/{vocab.pronunciation || ''}/</Text>
                      </Td>
                      <Td>{vocab.meaning}</Td>
                      <Td>
                        <Badge colorScheme="purple">{vocab.word_type}</Badge>
                      </Td>
                      <Td>
                        <Badge 
                          colorScheme={
                            vocab.difficulty_level === 'Easy' ? 'green' :
                            vocab.difficulty_level === 'Medium' ? 'yellow' : 'red'
                          }
                        >
                          {vocab.difficulty_level}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge 
                          colorScheme={vocab.is_memorized === 1 ? 'green' : 'gray'}
                        >
                          {vocab.is_memorized === 1 ? 'Đã thuộc' : 'Chưa thuộc'}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            icon={<FaVolumeUp />}
                            aria-label="Phát âm"
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            onClick={() => playAudio(vocab.audio)}
                          />
                          <IconButton
                            icon={<FaStar />}
                            aria-label="Đánh dấu"
                            size="sm"
                            variant="ghost"
                            colorScheme={vocab.is_memorized === 1 ? "yellow" : "gray"}
                            onClick={() => handleToggleMemorized(vocab.vocab_id, vocab.is_memorized)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              
              {/* Phân trang */}
              <Flex 
                justify="space-between" 
                align="center" 
                p={4} 
                borderTopWidth="1px"
                borderColor={borderColor}
              >
                <Text fontSize="sm">
                  Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredVocabulary.length)} trên {filteredVocabulary.length} từ vựng
                </Text>
                
                <HStack>
                  <IconButton
                    icon={<ChevronLeftIcon />}
                    aria-label="Trang trước"
                    isDisabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  />
                  
                  <Text mx={2}>
                    Trang {currentPage} / {totalPages}
                  </Text>
                  
                  <IconButton
                    icon={<ChevronRightIcon />}
                    aria-label="Trang kế"
                    isDisabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  />
                </HStack>
              </Flex>
            </Box>
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
              <Text fontSize="lg" mb={4}>
                {notebookVocabulary && notebookVocabulary.length > 0 
                  ? 'Không tìm thấy từ vựng nào phù hợp với bộ lọc' 
                  : 'Bạn chưa học từ vựng nào'}
              </Text>
              {notebookVocabulary && notebookVocabulary.length > 0 ? (
                <Button 
                  colorScheme="blue" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedType('');
                    setSelectedDifficulty('');
                    setSelectedMemorized('');
                  }}
                >
                  Đặt lại bộ lọc
                </Button>
              ) : (
                <Button 
                  colorScheme="blue" 
                  onClick={() => window.location.href = '/learn'}
                >
                  Bắt đầu học ngay
                </Button>
              )}
            </Flex>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default NotebookPage;