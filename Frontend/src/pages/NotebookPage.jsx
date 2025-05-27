import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Container, Heading, Text, Table, Thead, Tbody, Tr, Th, Td, Button, IconButton, Input, Flex, VStack, HStack, Badge, useColorModeValue, Select, InputGroup, InputLeftElement, Spinner, Alert, AlertIcon, useToast, Stat, StatLabel, StatNumber, StatGroup, StatHelpText, useDisclosure, Icon
} from '@chakra-ui/react';
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon, RepeatIcon, LockIcon } from '@chakra-ui/icons';
import { FaVolumeUp, FaStar, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import useVocabularyStore from '../store/vocabularyStore';
import useStudentProfileStore from '../store/studentProfileStore';
import UserSettingsModal from '../components/UserSettingsModal';

const NotebookPage = () => {
  const { notebookVocabulary, fetchNotebookVocabulary, isLoading: vocabLoading, error: vocabError, markVocabularyStatus } = useVocabularyStore();
  const { profile, hasProfile, fetchProfile, isLoading: profileLoading } = useStudentProfileStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedMemorized, setSelectedMemorized] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('word');
  const [sortDirection, setSortDirection] = useState('asc');
  const [profileChecked, setProfileChecked] = useState(false);
  const toast = useToast();
  const { isOpen: isSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const tableBg = useColorModeValue('white', 'gray.900');
  const bgGradient = useColorModeValue('linear(to-b, blue.50, gray.50)', 'linear(to-b, gray.900, gray.800)');
  const lockBg = useColorModeValue('gray.50', 'gray.900');
  const lockBorder = useColorModeValue('gray.300', 'gray.600');
  const itemsPerPage = 10;

  const uniqueWordTypes = useMemo(() => {
    if (!notebookVocabulary || notebookVocabulary.length === 0) return [];
    const types = notebookVocabulary.map(vocab => vocab.word_type).filter(type => type && type.trim() !== '');
    return [...new Set(types)].sort();
  }, [notebookVocabulary]);

  const filteredVocabulary = useMemo(() => {
    return notebookVocabulary ? notebookVocabulary.filter(vocab => {
      const matchesSearchTerm = vocab.word?.toLowerCase().includes(searchTerm.toLowerCase()) || vocab.meaning?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === '' || (vocab.word_type && vocab.word_type.toLowerCase() === selectedType.toLowerCase());
      const matchesDifficulty = selectedDifficulty === '' || vocab.difficulty_level === selectedDifficulty;
      const matchesMemorized = selectedMemorized === '' || (selectedMemorized === 'memorized' && vocab.is_memorized === 1) || (selectedMemorized === 'not_memorized' && vocab.is_memorized === 0);
      return matchesSearchTerm && matchesType && matchesDifficulty && matchesMemorized;
    }) : [];
  }, [notebookVocabulary, searchTerm, selectedType, selectedDifficulty, selectedMemorized]);

  const sortedVocabulary = useMemo(() => {
    return [...filteredVocabulary].sort((a, b) => {
      const fieldA = a[sortField] || '';
      const fieldB = b[sortField] || '';
      if (typeof fieldA === 'string') {
        return sortDirection === 'asc' ? fieldA.localeCompare(fieldB) : fieldB.localeCompare(fieldA);
      } else {
        return sortDirection === 'asc' ? fieldA - fieldB : fieldB - fieldA;
      }
    });
  }, [filteredVocabulary, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedVocabulary.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVocabulary = sortedVocabulary.slice(startIndex, startIndex + itemsPerPage);

  const stats = useMemo(() => {
    if (!notebookVocabulary || notebookVocabulary.length === 0) {
      return { total: 0, memorized: 0, notMemorized: 0, memorizedPercentage: 0 };
    }
    const total = notebookVocabulary.length;
    const memorized = notebookVocabulary.filter(vocab => vocab.is_memorized === 1).length;
    const notMemorized = total - memorized;
    const memorizedPercentage = (memorized / total) * 100;
    return { total, memorized, notMemorized, memorizedPercentage };
  }, [notebookVocabulary]);

  useEffect(() => {
    const checkProfileStatus = async () => {
      try {
        await fetchProfile();
        setProfileChecked(true);
      } catch (error) {
        console.error('Error checking profile:', error);
        setProfileChecked(true);
      }
    };
    checkProfileStatus();
  }, [fetchProfile]);

  useEffect(() => {
    if (profileChecked && hasProfile()) {
      fetchNotebookVocabulary();
    }
  }, [fetchNotebookVocabulary, hasProfile, profileChecked]);

  const handleProfileCompleted = async () => {
    await fetchProfile();
    if (hasProfile()) {
      await fetchNotebookVocabulary();
      toast({
        title: "Chúc mừng!",
        description: "Sổ tay từ vựng đã được mở khóa. Bạn có thể bắt đầu sử dụng tính năng này.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    }
    onSettingsClose();
  };

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const playAudio = (audio) => {
    if (audio) {
      const audioObj = new Audio(audio);
      audioObj.play();
    } else {
      toast({ title: "Không có file âm thanh", status: "info", duration: 2000, isClosable: true });
    }
  };

  const handleToggleMemorized = async (vocabId, currentStatus) => {
    try {
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

  const handleRefresh = () => {
    fetchNotebookVocabulary();
    toast({ title: "Đã làm mới dữ liệu", status: "info", duration: 2000, isClosable: true });
  };

  const renderSortIcon = (field) => {
    if (field !== sortField) return <FaSort />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const LockScreen = () => (
    <Container maxW="container.md">
      <VStack spacing={8} align="center" py={16}>
        <Box p={8} bg={lockBg} borderRadius="2xl" borderWidth="2px" borderColor={lockBorder} borderStyle="dashed" textAlign="center" maxW="500px">
          <VStack spacing={6}>
            <Icon as={LockIcon} boxSize="60px" color="gray.400" mb={2} />
            <Heading size="lg" color="gray.600">Tính năng đang bị khóa</Heading>
            <Text fontSize="md" color="gray.500" lineHeight="1.6">
              Để sử dụng <strong>Sổ tay từ vựng</strong>, bạn cần hoàn thiện thông tin cá nhân trước. Điều này giúp chúng tôi cá nhân hóa trải nghiệm học tập tốt hơn cho bạn.
            </Text>
            <VStack spacing={3} pt={4}>
              <Text fontSize="sm" fontWeight="medium" color="blue.600">Những gì bạn cần làm:</Text>
              <VStack spacing={2} align="start" fontSize="sm" color="gray.600">
                <Text>✓ Cập nhật họ tên đầy đủ</Text>
                <Text>✓ Thêm thông tin cá nhân</Text>
                <Text>✓ Hoàn thiện hồ sơ học viên</Text>
              </VStack>
            </VStack>``
          </VStack>
        </Box>
      </VStack>
    </Container>
  );

  if (profileLoading || !profileChecked) {
    return (
      <Box pt="100px" pb="50px" minH="100vh" bgGradient={bgGradient}>
        <Container maxW="container.xl">
          <Flex justify="center" py={10}>
            <Spinner size="xl" color="blue.500" />
            <Text ml={4}>Đang kiểm tra quyền truy cập...</Text>
          </Flex>
        </Container>
        <UserSettingsModal isOpen={isSettingsOpen} onClose={handleProfileCompleted} />
      </Box>
    );
  }

  if (!hasProfile()) {
    return (
      <Box pt="100px" pb="50px" minH="100vh" bgGradient={bgGradient}>
        <VStack spacing={6} mb={8}>
          <Heading textAlign="center" size="lg" bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text">
            Sổ tay từ vựng
          </Heading>
        </VStack>
        <LockScreen />
        <UserSettingsModal isOpen={isSettingsOpen} onClose={handleProfileCompleted} />
      </Box>
    );
  }

  return (
    <Box pt="100px" pb="50px" minH="100vh" bgGradient={bgGradient}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Heading textAlign="center" size="lg" bgGradient="linear(to-r, blue.400, purple.500)" bgClip="text">
            Sổ tay từ vựng
          </Heading>
          {notebookVocabulary && notebookVocabulary.length > 0 && (
            <Box bg={cardBg} p={5} borderRadius="lg" borderWidth="1px" borderColor={borderColor} boxShadow="md">
              <Heading size="md" mb={4}>Thống kê học tập</Heading>
              <StatGroup>
                <Stat>
                  <StatLabel>Tổng số từ vựng</StatLabel>
                  <StatNumber>{stats.total}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Đã thuộc</StatLabel>
                  <StatNumber>{stats.memorized}</StatNumber>
                  <StatHelpText>{stats.memorizedPercentage.toFixed(1)}%</StatHelpText>
                </Stat>
                <Stat>
                  <StatLabel>Chưa thuộc</StatLabel>
                  <StatNumber>{stats.notMemorized}</StatNumber>
                  <StatHelpText>{(100 - stats.memorizedPercentage).toFixed(1)}%</StatHelpText>
                </Stat>
              </StatGroup>
            </Box>
          )}
          
          <Box bg={cardBg} p={5} borderRadius="lg" borderWidth="1px" borderColor={borderColor} boxShadow="md">
            <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" gap={4} wrap="wrap">
              <InputGroup maxW={{ md: '350px' }}>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.300" />
                </InputLeftElement>
                <Input placeholder="Tìm kiếm từ vựng hoặc nghĩa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </InputGroup>
              <HStack spacing={4} flexWrap="wrap">
                <Select placeholder="Loại từ" value={selectedType} onChange={(e) => setSelectedType(e.target.value)} size="md" maxW="150px">
                  {uniqueWordTypes.map((type) => (
                    <option key={type} value={type.toLowerCase()}>{type}</option>
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
                <Select placeholder="Độ khó" value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)} size="md" maxW="150px">
                  <option value="Easy">Dễ</option>
                  <option value="Medium">Trung bình</option>
                  <option value="Hard">Khó</option>
                </Select>
                <Select placeholder="Trạng thái" value={selectedMemorized} onChange={(e) => setSelectedMemorized(e.target.value)} size="md" maxW="150px">
                  <option value="memorized">Đã thuộc</option>
                  <option value="not_memorized">Chưa thuộc</option>
                </Select>
                <IconButton aria-label="Làm mới" icon={<RepeatIcon />} onClick={handleRefresh} isLoading={vocabLoading} />
                <Button onClick={() => { setSearchTerm(''); setSelectedType(''); setSelectedDifficulty(''); setSelectedMemorized(''); }} size="md">
                  Đặt lại
                </Button>
              </HStack>
            </Flex>
          </Box>
          
          {vocabError && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Text>{vocabError}</Text>
            </Alert>
          )}
          
          {vocabLoading ? (
            <Flex justify="center" py={10}>
              <Spinner size="xl" color="blue.500" />
              <Text ml={4}>Đang tải từ vựng...</Text>
            </Flex>
          ) : filteredVocabulary.length > 0 ? (
            <Box overflowX="auto" borderRadius="lg" borderWidth="1px" borderColor={borderColor} boxShadow="md">
              <Table variant="simple" bg={tableBg}>
                <Thead>
                  <Tr>
                    <Th cursor="pointer" onClick={() => handleSort('word')} whiteSpace="nowrap">
                      <Flex align="center">Từ vựng {renderSortIcon('word')}</Flex>
                    </Th>
                    <Th cursor="pointer" onClick={() => handleSort('meaning')}>
                      <Flex align="center">Nghĩa {renderSortIcon('meaning')}</Flex>
                    </Th>
                    <Th cursor="pointer" onClick={() => handleSort('word_type')} whiteSpace="nowrap">
                      <Flex align="center">Loại từ {renderSortIcon('word_type')}</Flex>
                    </Th>
                    <Th cursor="pointer" onClick={() => handleSort('difficulty_level')} whiteSpace="nowrap">
                      <Flex align="center">Độ khó {renderSortIcon('difficulty_level')}</Flex>
                    </Th>
                    <Th cursor="pointer" onClick={() => handleSort('is_memorized')} whiteSpace="nowrap">
                      <Flex align="center">Trạng thái {renderSortIcon('is_memorized')}</Flex>
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
                        <Badge colorScheme={vocab.difficulty_level === 'Easy' ? 'green' : vocab.difficulty_level === 'Medium' ? 'yellow' : 'red'}>
                          {vocab.difficulty_level}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={vocab.is_memorized === 1 ? 'green' : 'gray'}>
                          {vocab.is_memorized === 1 ? 'Đã thuộc' : 'Chưa thuộc'}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton icon={<FaVolumeUp />} aria-label="Phát âm" size="sm" variant="ghost" colorScheme="blue" onClick={() => playAudio(vocab.audio)} />
                          <IconButton icon={<FaStar />} aria-label="Đánh dấu" size="sm" variant="ghost" colorScheme={vocab.is_memorized === 1 ? "yellow" : "gray"} onClick={() => handleToggleMemorized(vocab.vocab_id, vocab.is_memorized)} />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              <Flex justify="space-between" align="center" p={4} borderTopWidth="1px" borderColor={borderColor}>
                <Text fontSize="sm">
                  Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredVocabulary.length)} trên {filteredVocabulary.length} từ vựng
                </Text>
                <HStack>
                  <IconButton icon={<ChevronLeftIcon />} aria-label="Trang trước" isDisabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} />
                  <Text mx={2}>Trang {currentPage} / {totalPages}</Text>
                  <IconButton icon={<ChevronRightIcon />} aria-label="Trang kế" isDisabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} />
                </HStack>
              </Flex>
            </Box>
          ) : (
            <Flex direction="column" align="center" justify="center" py={10} bg={cardBg} p={6} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
              <Text fontSize="lg" mb={4}>
                {notebookVocabulary && notebookVocabulary.length > 0 ? 'Không tìm thấy từ vựng nào phù hợp với bộ lọc' : 'Bạn chưa học từ vựng nào'}
              </Text>
              {notebookVocabulary && notebookVocabulary.length > 0 ? (
                <Button colorScheme="blue" onClick={() => { setSearchTerm(''); setSelectedType(''); setSelectedDifficulty(''); setSelectedMemorized(''); }}>
                  Đặt lại bộ lọc
                </Button>
              ) : (
                <Button colorScheme="blue" onClick={() => window.location.href = '/learn'}>
                  Bắt đầu học ngay
                </Button>
              )}
            </Flex>
          )}
        </VStack>
      </Container>
      <UserSettingsModal isOpen={isSettingsOpen} onClose={handleProfileCompleted} />
    </Box>
  );
};

export default NotebookPage;