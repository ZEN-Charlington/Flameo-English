import React, { useEffect, useState } from 'react';
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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Select,
  InputGroup,
  InputLeftElement
} from '@chakra-ui/react';
import { 
  ChevronDownIcon, 
  SearchIcon, 
  ExternalLinkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  DeleteIcon
} from '@chakra-ui/icons';
import { FaVolumeUp, FaStar, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import useVocabularyStore from '../store/vocabularyStore';

const NotebookPage = () => {
  const { notebookVocabulary, fetchNotebookVocabulary, isLoading } = useVocabularyStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('word');
  const [sortDirection, setSortDirection] = useState('asc');
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tableBg = useColorModeValue('white', 'gray.900');
  const bgGradient = useColorModeValue(
    'linear(to-b, blue.50, gray.50)',
    'linear(to-b, gray.900, gray.800)'
  );
  
  // Số từ vựng trên một trang
  const itemsPerPage = 10;
  
  useEffect(() => {
    fetchNotebookVocabulary();
  }, [fetchNotebookVocabulary]);
  
  // Xử lý tìm kiếm và lọc
  const filteredVocabulary = notebookVocabulary.filter(vocab => {
    const matchesSearchTerm = vocab.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             vocab.meaning.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === '' || vocab.word_type === selectedType;
    
    const matchesDifficulty = selectedDifficulty === '' || 
                             vocab.difficulty_level === selectedDifficulty;
    
    return matchesSearchTerm && matchesType && matchesDifficulty;
  });
  
  // Xử lý sắp xếp
  const sortedVocabulary = [...filteredVocabulary].sort((a, b) => {
    const fieldA = a[sortField];
    const fieldB = b[sortField];
    
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
  const totalPages = Math.ceil(sortedVocabulary.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVocabulary = sortedVocabulary.slice(startIndex, startIndex + itemsPerPage);
  
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
    }
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
            >
              <InputGroup maxW={{ md: '400px' }}>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input 
                  placeholder="Tìm kiếm từ vựng hoặc nghĩa..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              
              <HStack spacing={4}>
                <Select 
                  placeholder="Loại từ" 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  size="md"
                  maxW="150px"
                >
                  <option value="Noun">Danh từ</option>
                  <option value="Verb">Động từ</option>
                  <option value="Adjective">Tính từ</option>
                  <option value="Adverb">Trạng từ</option>
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
                
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedType('');
                    setSelectedDifficulty('');
                  }}
                  size="md"
                >
                  Đặt lại
                </Button>
              </HStack>
            </Flex>
          </Box>
          
          {/* Bảng từ vựng */}
          {isLoading ? (
            <Flex justify="center" py={10}>
              <Text>Đang tải từ vựng...</Text>
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
                    <Th>Thao tác</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginatedVocabulary.map((vocab) => (
                    <Tr key={vocab.vocab_id}>
                      <Td>
                        <Flex align="center">
                          <Text fontWeight="medium" mr={2}>{vocab.word}</Text>
                          <IconButton
                            icon={<FaVolumeUp />}
                            aria-label="Phát âm"
                            size="sm"
                            variant="ghost"
                            onClick={() => playAudio(vocab.audio)}
                          />
                        </Flex>
                        <Text fontSize="xs" color="gray.500">{vocab.pronunciation}</Text>
                      </Td>
                      <Td>{vocab.meaning}</Td>
                      <Td>
                        <Badge>{vocab.word_type}</Badge>
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
                        <HStack spacing={2}>
                          <IconButton
                            icon={<ExternalLinkIcon />}
                            aria-label="Xem chi tiết"
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                          />
                          <IconButton
                            icon={vocab.is_memorized ? <FaStar /> : <FaStar />}
                            aria-label="Đánh dấu"
                            size="sm"
                            variant="ghost"
                            colorScheme={vocab.is_memorized ? "yellow" : "gray"}
                          />
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<ChevronDownIcon />}
                              variant="ghost"
                              size="sm"
                            />
                            <MenuList>
                              <MenuItem icon={<FaVolumeUp />}>
                                Phát âm
                              </MenuItem>
                              <MenuItem icon={<ExternalLinkIcon />}>
                                Xem chi tiết
                              </MenuItem>
                              <MenuItem icon={<DeleteIcon />} color="red.500">
                                Xóa
                              </MenuItem>
                            </MenuList>
                          </Menu>
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
              <Text fontSize="lg" mb={4}>Không tìm thấy từ vựng nào</Text>
              <Button 
                colorScheme="blue" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('');
                  setSelectedDifficulty('');
                }}
              >
                Đặt lại bộ lọc
              </Button>
            </Flex>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default NotebookPage;