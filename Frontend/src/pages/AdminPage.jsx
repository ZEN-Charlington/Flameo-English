import { useState, useEffect, useMemo } from 'react';
import { 
  Box, Container, Tabs, TabList, TabPanels, Tab, TabPanel, Heading, Grid, 
  Stat, StatLabel, StatNumber, StatHelpText, Button, HStack, VStack, Input, 
  InputGroup, InputLeftElement, Modal, ModalOverlay, ModalContent, ModalHeader, 
  ModalCloseButton, ModalBody, ModalFooter, useDisclosure, useToast, Text, 
  Select, Textarea, FormControl, FormLabel, FormErrorMessage, Spinner, Center, 
  useColorModeValue, IconButton, Badge, Table, Thead, Tbody, Tr, Th, Td, 
  Switch, Flex 
} from '@chakra-ui/react';
import { 
  FaSearch, FaPlus, FaEdit, FaTrash, FaBook, FaGraduationCap, 
  FaChartBar, FaArrowLeft, FaVolumeUp, FaEye, FaSearchPlus 
} from 'react-icons/fa';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import useAdminStore from '../store/adminStore';
import AudioRecorder from '../components/AudioRecorder';
import VocabularySearchModal from '../components/VocabularySearchModal';

const AdminPage = () => {
  const { 
    topics, lessons, selectedLessonId, loading, error, statistics, 
    initializeAdminData, selectLesson, createTopic, createLesson, 
    updateTopic, updateLesson, deleteTopic, deleteLesson, 
    toggleTopicActive, toggleLessonActive, addVocabularyToLesson, 
    updateLessonVocabulary, removeLessonVocabulary, clearError, 
    getCurrentLessonVocabulary, getLessonById, loadVocabularyPage 
  } = useAdminStore();

  const [activeTab, setActiveTab] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { 
    isOpen: isSearchModalOpen, 
    onOpen: onSearchModalOpen, 
    onClose: onSearchModalClose 
  } = useDisclosure();
  const toast = useToast();
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    initializeAdminData();
  }, []);

  useEffect(() => {
    if (error) {
      toast({ 
        title: "Lỗi", 
        description: error, 
        status: "error", 
        duration: 5000, 
        isClosable: true 
      });
      clearError();
    }
  }, [error, toast, clearError]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchInput, statusFilter, topicFilter]);

  useEffect(() => {
    setSearchInput('');
  }, [selectedLessonId]);

  const filteredTopics = useMemo(() => {
    return topics.filter(topic => {
      const matchesSearch = searchInput === '' || 
        topic.topic_name?.toLowerCase().includes(searchInput.toLowerCase()) || 
        topic.description?.toLowerCase().includes(searchInput.toLowerCase());
      const matchesStatus = statusFilter === '' || 
        (statusFilter === 'active' && topic.is_active === 1) || 
        (statusFilter === 'inactive' && topic.is_active === 0);
      return matchesSearch && matchesStatus;
    });
  }, [topics, searchInput, statusFilter]);

  const filteredLessons = useMemo(() => {
    return lessons.filter(lesson => {
      const matchesSearch = searchInput === '' || 
        lesson.title?.toLowerCase().includes(searchInput.toLowerCase());
      const matchesStatus = statusFilter === '' || 
        (statusFilter === 'active' && lesson.is_active === 1) || 
        (statusFilter === 'inactive' && lesson.is_active === 0);
      const matchesTopic = topicFilter === '' || 
        lesson.topic_id?.toString() === topicFilter;
      return matchesSearch && matchesStatus && matchesTopic;
    });
  }, [lessons, searchInput, statusFilter, topicFilter]);

  const currentVocabData = getCurrentLessonVocabulary();
  const vocabularyList = currentVocabData?.vocabulary || [];
  const vocabularyPagination = currentVocabData?.pagination || {};

  const filteredVocabulary = useMemo(() => {
    return vocabularyList.filter(vocab => {
      return searchInput === '' || 
        vocab.word?.toLowerCase().includes(searchInput.toLowerCase()) || 
        vocab.meaning?.toLowerCase().includes(searchInput.toLowerCase());
    });
  }, [vocabularyList, searchInput]);

  const paginateData = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return { 
      data: data.slice(startIndex, startIndex + itemsPerPage), 
      totalPages: Math.ceil(data.length / itemsPerPage), 
      total: data.length 
    };
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({});
    setFormErrors({});
    onOpen();
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setFormErrors({});
    onOpen();
  };

  const validateForm = () => {
    const errors = {};
    if (activeTab === 1) {
      if (!formData.topic_name?.trim()) errors.topic_name = 'Tên chủ đề không được để trống';
      if (!formData.description?.trim()) errors.description = 'Mô tả không được để trống';
    } else if (activeTab === 2) {
      if (selectedLessonId) {
        if (!formData.word?.trim()) errors.word = 'Từ vựng không được để trống';
        if (!formData.meaning?.trim()) errors.meaning = 'Nghĩa của từ không được để trống';
        if (!formData.pronunciation?.trim()) errors.pronunciation = 'Phát âm không được để trống';
        if (!formData.word_type?.trim()) errors.word_type = 'Loại từ không được để trống';
        if (!formData.difficulty_level || !['Easy', 'Medium', 'Hard'].includes(formData.difficulty_level)) {
          errors.difficulty_level = 'Độ khó phải là Easy, Medium hoặc Hard';
        }
      } else {
        if (!formData.title?.trim()) errors.title = 'Tiêu đề bài học không được để trống';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      const submitData = { ...formData };
      if (activeTab === 1) {
        editingItem ? 
          await updateTopic(editingItem.topic_id, submitData) : 
          await createTopic(submitData);
      } else if (activeTab === 2) {
        if (selectedLessonId) {
          if (editingItem) {
            await updateLessonVocabulary(selectedLessonId, editingItem.vocab_id, submitData);
          } else {
            await addVocabularyToLesson(selectedLessonId, submitData);
            await loadVocabularyPage(selectedLessonId, 1);
          }
        } else {
          editingItem ? 
            await updateLesson(editingItem.lesson_id, submitData) : 
            await createLesson(submitData);
        }
      }
      toast({ 
        title: "Thành công", 
        description: `${editingItem ? 'Cập nhật' : 'Tạo mới'} thành công`, 
        status: "success" 
      });
      onClose();
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa?')) return;
    try {
      if (activeTab === 1) {
        await deleteTopic(item.topic_id);
      } else if (activeTab === 2) {
        selectedLessonId ? 
          await removeLessonVocabulary(selectedLessonId, item.vocab_id) : 
          await deleteLesson(item.lesson_id);
      }
      toast({ 
        title: "Thành công", 
        description: "Xóa thành công", 
        status: "success" 
      });
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleToggleActive = async (item, type) => {
    try {
      type === 'topic' ? 
        await toggleTopicActive(item.topic_id, item.is_active) : 
        await toggleLessonActive(item.lesson_id, item.is_active);
      toast({ 
        title: "Thành công", 
        description: `Đã ${item.is_active === 1 ? 'tắt' : 'bật'} trạng thái`, 
        status: "success" 
      });
    } catch (error) {
      console.error('Toggle error:', error);
    }
  };

  const handleVocabularyPageChange = (page) => {
    if (selectedLessonId) {
      loadVocabularyPage(selectedLessonId, page);
    }
  };

  if (loading.initializing) {
    return (
      <Center h="100vh">
        <VStack>
          <Spinner size="xl" color="blue.500" />
          <Text>Đang tải dữ liệu admin...</Text>
        </VStack>
      </Center>
    );
  }

  const renderStatistics = () => (
    <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
      <Stat p={4} bg={bg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
        <StatLabel>Tổng số chủ đề</StatLabel>
        <StatNumber>{statistics?.total_topics || 0}</StatNumber>
        <StatHelpText>Hoạt động: {statistics?.active_topics || 0}</StatHelpText>
      </Stat>
      <Stat p={4} bg={bg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
        <StatLabel>Tổng số bài học</StatLabel>
        <StatNumber>{statistics?.total_lessons || 0}</StatNumber>
        <StatHelpText>Hoạt động: {statistics?.active_lessons || 0}</StatHelpText>
      </Stat>
      <Stat p={4} bg={bg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
        <StatLabel>Tổng số từ vựng</StatLabel>
        <StatNumber>{statistics?.total_vocabulary || 0}</StatNumber>
      </Stat>
      <Stat p={4} bg={bg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
        <StatLabel>Tổng người dùng</StatLabel>
        <StatNumber>{statistics?.total_users || 0}</StatNumber>
      </Stat>
    </Grid>
  );

  const renderTopicsTable = () => {
    const paginatedData = paginateData(filteredTopics);
    return (
      <VStack spacing={4} align="stretch">
        <Flex direction={{ base: 'column', md: 'row' }} gap={4} align="center" justify="space-between">
          <HStack spacing={4} flexWrap="wrap">
            <InputGroup maxW="300px">
              <InputLeftElement><FaSearch color="gray.300" /></InputLeftElement>
              <Input 
                placeholder="Tìm kiếm chủ đề..." 
                value={searchInput} 
                onChange={(e) => setSearchInput(e.target.value)} 
              />
            </InputGroup>
            <Select 
              placeholder="Trạng thái" 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              maxW="150px"
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm dừng</option>
            </Select>
            <Button 
              onClick={() => { 
                setSearchInput(''); 
                setStatusFilter(''); 
                setCurrentPage(1); 
              }} 
              size="sm"
            >
              Đặt lại
            </Button>
          </HStack>
          <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={handleCreate}>
            Tạo chủ đề
          </Button>
        </Flex>
        
        <Box overflowX="auto" borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <Table variant="simple" bg={bg}>
            <Thead>
              <Tr>
                <Th>Tên chủ đề</Th>
                <Th>Mô tả</Th>
                <Th>Số bài học</Th>
                <Th>Trạng thái</Th>
                <Th>Thao tác</Th>
              </Tr>
            </Thead>
            <Tbody>
              {paginatedData.data.map((topic) => (
                <Tr key={`topic-${topic.topic_id}`}>
                  <Td fontWeight="bold">{topic.topic_name}</Td>
                  <Td maxW="200px">
                    <Text noOfLines={2} title={topic.description}>
                      {topic.description}
                    </Text>
                  </Td>
                  <Td>{topic.lesson_count || 0}</Td>
                  <Td>
                    <HStack>
                      <Switch 
                        isChecked={topic.is_active === 1} 
                        onChange={() => handleToggleActive(topic, 'topic')} 
                        colorScheme="green" 
                        size="sm" 
                      />
                      <Badge colorScheme={topic.is_active === 1 ? "green" : "gray"}>
                        {topic.is_active === 1 ? "Hoạt động" : "Tạm dừng"}
                      </Badge>
                    </HStack>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton 
                        aria-label="Chỉnh sửa" 
                        icon={<FaEdit />} 
                        size="sm" 
                        colorScheme="blue" 
                        variant="outline" 
                        onClick={() => handleEdit(topic)} 
                      />
                      <IconButton 
                        aria-label="Xóa" 
                        icon={<FaTrash />} 
                        size="sm" 
                        colorScheme="gray" 
                        variant="outline" 
                        onClick={() => handleDelete(topic)} 
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
        
        {paginatedData.totalPages > 1 && (
          <Flex justify="space-between" align="center">
            <Text fontSize="sm">
              Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, paginatedData.total)} trên {paginatedData.total} chủ đề
            </Text>
            <HStack>
              <IconButton 
                icon={<ChevronLeftIcon />} 
                aria-label="Trang trước" 
                isDisabled={currentPage === 1} 
                onClick={() => setCurrentPage(currentPage - 1)} 
              />
              <Text>Trang {currentPage} / {paginatedData.totalPages}</Text>
              <IconButton 
                icon={<ChevronRightIcon />} 
                aria-label="Trang sau" 
                isDisabled={currentPage === paginatedData.totalPages} 
                onClick={() => setCurrentPage(currentPage + 1)} 
              />
            </HStack>
          </Flex>
        )}
      </VStack>
    );
  };

  const renderLessonsTable = () => {
    const paginatedData = paginateData(filteredLessons);
    return (
      <VStack spacing={4} align="stretch">
        <Flex direction={{ base: 'column', md: 'row' }} gap={4} align="center" justify="space-between">
          <HStack spacing={4} flexWrap="wrap">
            <InputGroup maxW="300px">
              <InputLeftElement><FaSearch color="gray.300" /></InputLeftElement>
              <Input 
                placeholder="Tìm kiếm bài học..." 
                value={searchInput} 
                onChange={(e) => setSearchInput(e.target.value)} 
              />
            </InputGroup>
            <Select 
              placeholder="Trạng thái" 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              maxW="150px"
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm dừng</option>
            </Select>
            <Select 
              placeholder="Chủ đề" 
              value={topicFilter} 
              onChange={(e) => setTopicFilter(e.target.value)} 
              maxW="200px"
            >
              {topics.map(topic => (
                <option key={topic.topic_id} value={topic.topic_id}>
                  {topic.topic_name}
                </option>
              ))}
            </Select>
            <Button 
              onClick={() => { 
                setSearchInput(''); 
                setStatusFilter(''); 
                setTopicFilter(''); 
                setCurrentPage(1); 
              }} 
              size="sm"
            >
              Đặt lại
            </Button>
          </HStack>
          <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={handleCreate}>
            Tạo bài học
          </Button>
        </Flex>
        
        <Box overflowX="auto" borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <Table variant="simple" bg={bg}>
            <Thead>
              <Tr>
                <Th>Tiêu đề</Th>
                <Th>Chủ đề</Th>
                <Th>Số từ vựng</Th>
                <Th>Trạng thái</Th>
                <Th>Thao tác</Th>
              </Tr>
            </Thead>
            <Tbody>
              {paginatedData.data.map((lesson) => (
                <Tr key={`lesson-${lesson.lesson_id}`}>
                  <Td fontWeight="bold">{lesson.title}</Td>
                  <Td>
                    <Badge colorScheme="blue">
                      {lesson.topic_name || 'Chưa gán chủ đề'}
                    </Badge>
                  </Td>
                  <Td>{lesson.vocab_count || 0}</Td>
                  <Td>
                    <HStack>
                      <Switch 
                        isChecked={lesson.is_active === 1} 
                        onChange={() => handleToggleActive(lesson, 'lesson')} 
                        colorScheme="green" 
                        size="sm" 
                      />
                      <Badge colorScheme={lesson.is_active === 1 ? "green" : "gray"}>
                        {lesson.is_active === 1 ? "Hoạt động" : "Tạm dừng"}
                      </Badge>
                    </HStack>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton 
                        aria-label="Xem từ vựng" 
                        icon={<FaEye />} 
                        size="sm" 
                        colorScheme="teal" 
                        variant="outline" 
                        onClick={() => selectLesson(lesson.lesson_id)} 
                      />
                      <IconButton 
                        aria-label="Chỉnh sửa" 
                        icon={<FaEdit />} 
                        size="sm" 
                        colorScheme="blue" 
                        variant="outline" 
                        onClick={() => handleEdit(lesson)} 
                      />
                      <IconButton 
                        aria-label="Xóa" 
                        icon={<FaTrash />} 
                        size="sm" 
                        colorScheme="gray" 
                        variant="outline" 
                        onClick={() => handleDelete(lesson)} 
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
        
        {paginatedData.totalPages > 1 && (
          <Flex justify="space-between" align="center">
            <Text fontSize="sm">
              Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, paginatedData.total)} trên {paginatedData.total} bài học
            </Text>
            <HStack>
              <IconButton 
                icon={<ChevronLeftIcon />} 
                aria-label="Trang trước" 
                isDisabled={currentPage === 1} 
                onClick={() => setCurrentPage(currentPage - 1)} 
              />
              <Text>Trang {currentPage} / {paginatedData.totalPages}</Text>
              <IconButton 
                icon={<ChevronRightIcon />} 
                aria-label="Trang sau" 
                isDisabled={currentPage === paginatedData.totalPages} 
                onClick={() => setCurrentPage(currentPage + 1)} 
              />
            </HStack>
          </Flex>
        )}
      </VStack>
    );
  };

  const renderVocabularyTable = () => {
    const currentLesson = getLessonById(selectedLessonId);
    const displayList = searchInput === '' ? vocabularyList : filteredVocabulary;
    const shouldUseServerPagination = searchInput === '';
    
    return (
      <VStack spacing={4} align="stretch">
        <HStack>
          <Button 
            leftIcon={<FaArrowLeft />} 
            variant="ghost" 
            onClick={() => selectLesson(null)}
          >
            Quay lại bài học
          </Button>
        </HStack>

        <Flex direction={{ base: 'column', md: 'row' }} gap={4} align="center" justify="space-between">
          <InputGroup maxW="300px">
            <InputLeftElement><FaSearch color="gray.300" /></InputLeftElement>
            <Input 
              placeholder="Tìm kiếm từ vựng..." 
              value={searchInput} 
              onChange={(e) => setSearchInput(e.target.value)} 
            />
          </InputGroup>
          <HStack>
            <Button 
              leftIcon={<FaSearchPlus />} 
              colorScheme="blue" 
              variant="outline"
              onClick={onSearchModalOpen}
            >
              Thêm từ có sẵn
            </Button>
            <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={handleCreate}>
              Tạo từ mới
            </Button>
          </HStack>
        </Flex>
        
        <Box p={4} bg={bg} borderRadius="lg" border="1px solid" borderColor={borderColor}>
          <Text fontWeight="bold" color="blue.500">
            Bài học: {currentLesson?.title}
          </Text>
        </Box>
        
        <Box overflowX="auto" borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <Table variant="simple" bg={bg}>
            <Thead>
              <Tr>
                <Th>Từ vựng</Th>
                <Th>Nghĩa</Th>
                <Th>Phát âm</Th>
                <Th>Độ khó</Th>
                <Th>Loại từ</Th>
                <Th>Thao tác</Th>
              </Tr>
            </Thead>
            <Tbody>
              {displayList.map((vocab, index) => (
                <Tr key={`vocab-${selectedLessonId}-${vocab.vocab_id}-${index}`}>
                  <Td fontWeight="bold">{vocab.word}</Td>
                  <Td maxW="200px">
                    <Text noOfLines={2} title={vocab.meaning}>
                      {vocab.meaning}
                    </Text>
                  </Td>
                  <Td fontStyle="italic">/{vocab.pronunciation}/</Td>
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
                    <Badge colorScheme="purple">{vocab.word_type}</Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      {vocab.audio && (
                        <IconButton 
                          aria-label="Phát âm" 
                          icon={<FaVolumeUp />} 
                          size="sm" 
                          colorScheme="teal" 
                          variant="outline" 
                          onClick={() => new Audio(vocab.audio).play()} 
                        />
                      )}
                      <IconButton 
                        aria-label="Chỉnh sửa" 
                        icon={<FaEdit />} 
                        size="sm" 
                        colorScheme="blue" 
                        variant="outline" 
                        onClick={() => handleEdit(vocab)} 
                      />
                      <IconButton 
                        aria-label="Xóa" 
                        icon={<FaTrash />} 
                        size="sm" 
                        colorScheme="gray" 
                        variant="outline" 
                        onClick={() => handleDelete(vocab)} 
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
        
        {shouldUseServerPagination && vocabularyPagination.total_pages > 1 && (
          <Flex justify="space-between" align="center">
            <Text fontSize="sm">
              Hiển thị {((vocabularyPagination.current_page - 1) * vocabularyPagination.items_per_page) + 1} - 
              {Math.min(vocabularyPagination.current_page * vocabularyPagination.items_per_page, vocabularyPagination.total_items)} 
              trên {vocabularyPagination.total_items} từ vựng
            </Text>
            <HStack>
              <IconButton 
                icon={<ChevronLeftIcon />} 
                aria-label="Trang trước" 
                isDisabled={!vocabularyPagination.has_prev} 
                onClick={() => handleVocabularyPageChange(vocabularyPagination.current_page - 1)} 
              />
              <Text>Trang {vocabularyPagination.current_page} / {vocabularyPagination.total_pages}</Text>
              <IconButton 
                icon={<ChevronRightIcon />} 
                aria-label="Trang sau" 
                isDisabled={!vocabularyPagination.has_next} 
                onClick={() => handleVocabularyPageChange(vocabularyPagination.current_page + 1)} 
              />
            </HStack>
          </Flex>
        )}
        
        {!shouldUseServerPagination && (() => {
          const paginatedVocab = paginateData(filteredVocabulary);
          return paginatedVocab.totalPages > 1 && (
            <Flex justify="space-between" align="center">
              <Text fontSize="sm">
                Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, paginatedVocab.total)} trên {paginatedVocab.total} từ vựng (đã lọc)
              </Text>
              <HStack>
                <IconButton 
                  icon={<ChevronLeftIcon />} 
                  aria-label="Trang trước" 
                  isDisabled={currentPage === 1} 
                  onClick={() => setCurrentPage(currentPage - 1)} 
                />
                <Text>Trang {currentPage} / {paginatedVocab.totalPages}</Text>
                <IconButton 
                  icon={<ChevronRightIcon />} 
                  aria-label="Trang sau" 
                  isDisabled={currentPage === paginatedVocab.totalPages} 
                  onClick={() => setCurrentPage(currentPage + 1)} 
                />
              </HStack>
            </Flex>
          );
        })()}
      </VStack>
    );
  };

  const renderModalContent = () => {
    if (activeTab === 1) {
      return (
        <>
          <FormControl isInvalid={formErrors.topic_name}>
            <FormLabel>Tên chủ đề *</FormLabel>
            <Input 
              value={formData.topic_name || ''} 
              onChange={(e) => setFormData({ ...formData, topic_name: e.target.value })} 
              placeholder="Nhập tên chủ đề" 
            />
            <FormErrorMessage>{formErrors.topic_name}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={formErrors.description}>
            <FormLabel>Mô tả *</FormLabel>
            <Textarea 
              value={formData.description || ''} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
              placeholder="Nhập mô tả" 
            />
            <FormErrorMessage>{formErrors.description}</FormErrorMessage>
          </FormControl>
        </>
      );
    }
    
    if (activeTab === 2) {
      if (selectedLessonId) {
        return (
          <>
            <FormControl isInvalid={formErrors.word}>
              <FormLabel>Từ vựng *</FormLabel>
              <Input 
                value={formData.word || ''} 
                onChange={(e) => setFormData({ ...formData, word: e.target.value })} 
                placeholder="Nhập từ vựng" 
              />
              <FormErrorMessage>{formErrors.word}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={formErrors.meaning}>
              <FormLabel>Nghĩa *</FormLabel>
              <Input 
                value={formData.meaning || ''} 
                onChange={(e) => setFormData({ ...formData, meaning: e.target.value })} 
                placeholder="Nhập nghĩa của từ" 
              />
              <FormErrorMessage>{formErrors.meaning}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={formErrors.pronunciation}>
              <FormLabel>Phát âm *</FormLabel>
              <Input 
                value={formData.pronunciation || ''} 
                onChange={(e) => setFormData({ ...formData, pronunciation: e.target.value })} 
                placeholder="Nhập phát âm" 
              />
              <FormErrorMessage>{formErrors.pronunciation}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={formErrors.difficulty_level}>
              <FormLabel>Độ khó *</FormLabel>
              <Select 
                value={formData.difficulty_level || ''} 
                onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
              >
                <option value="">Chọn độ khó</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </Select>
              <FormErrorMessage>{formErrors.difficulty_level}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={formErrors.word_type}>
              <FormLabel>Loại từ *</FormLabel>
              <Select 
                value={formData.word_type || ''} 
                onChange={(e) => setFormData({ ...formData, word_type: e.target.value })}
              >
                <option value="">Chọn loại từ</option>
                <option value="noun">Danh từ</option>
                <option value="verb">Động từ</option>
                <option value="adjective">Tính từ</option>
                <option value="adverb">Trạng từ</option>
                <option value="preposition">Giới từ</option>
                <option value="conjunction">Liên từ</option>
                <option value="pronoun">Đại từ</option>
                <option value="interjection">Thán từ</option>
              </Select>
              <FormErrorMessage>{formErrors.word_type}</FormErrorMessage>
            </FormControl>
            <FormControl>
              <FormLabel>Ví dụ</FormLabel>
              <Textarea 
                value={formData.example || ''} 
                onChange={(e) => setFormData({ ...formData, example: e.target.value })} 
                placeholder="Nhập ví dụ" 
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Audio URL</FormLabel>
              <Input 
                value={formData.audio || ''} 
                placeholder="Chưa có file audio - hãy ghi âm bên dưới"
                isDisabled={true}
                bg="gray.50"
                color="gray.600"
              />
              {formData.audio && (
                <Text fontSize="xs" color="green.600" mt={1}>
                  ✅ Đã có file audio
                </Text>
              )}
            </FormControl>
            
            <AudioRecorder onAudioUploaded={(url) => setFormData({ ...formData, audio: url })} />
          </>
        );
      } else {
        return (
          <>
            <FormControl isInvalid={formErrors.title}>
              <FormLabel>Tiêu đề bài học *</FormLabel>
              <Input 
                value={formData.title || ''} 
                onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                placeholder="Nhập tiêu đề bài học" 
              />
              <FormErrorMessage>{formErrors.title}</FormErrorMessage>
            </FormControl>
            <FormControl>
              <FormLabel>Chủ đề</FormLabel>
              <Select 
                value={formData.topic_id || ''} 
                onChange={(e) => setFormData({ ...formData, topic_id: e.target.value })}
              >
                <option value="">Chọn chủ đề</option>
                {topics.map(topic => (
                  <option key={topic.topic_id} value={topic.topic_id}>
                    {topic.topic_name}
                  </option>
                ))}
              </Select>
            </FormControl>
          </>
        );
      }
    }
    return null;
  };

  const getModalTitle = () => {
    const action = editingItem ? 'Chỉnh sửa' : 'Tạo mới';
    if (activeTab === 1) return `${action} chủ đề`;
    if (activeTab === 2) return selectedLessonId ? `${action} từ vựng` : `${action} bài học`;
    return action;
  };

  return (
    <Container maxW="1400px" py={8} mt={16}>
      <VStack spacing={6} align="stretch">
        <Heading 
          textAlign="center"
          bgGradient="linear(to-r, blue.400, purple.500)" 
          bgClip="text"
        >
          🔥 Quản trị hệ thống Flameo 🔥
        </Heading>
        <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab 
              _hover={{ 
                bg: useColorModeValue("blue.50", "blue.900"),
                color: "blue.500",
                transform: "translateY(-2px)",
                transition: "all 0.2s"
              }}
              _selected={{
                bg: useColorModeValue("blue.50", "blue.900"),
                color: "blue.500",
                borderBottomColor: "blue.500"
              }}
            >
              <HStack>
                <FaChartBar />
                <Text>Thống kê</Text>
              </HStack>
            </Tab>
            <Tab
              _hover={{ 
                bg: useColorModeValue("blue.50", "blue.900"),
                color: "blue.500",
                transform: "translateY(-2px)",
                transition: "all 0.2s"
              }}
              _selected={{
                bg: useColorModeValue("blue.50", "blue.900"),
                color: "blue.500",
                borderBottomColor: "blue.500"
              }}
            >
              <HStack>
                <FaBook />
                <Text>Chủ đề ({topics?.length || 0})</Text>
              </HStack>
            </Tab>
            <Tab
              _hover={{ 
                bg: useColorModeValue("blue.50", "blue.900"),
                color: "blue.500",
                transform: "translateY(-2px)",
                transition: "all 0.2s"
              }}
              _selected={{
                bg: useColorModeValue("blue.50", "blue.900"),
                color: "blue.500",
                borderBottomColor: "blue.500"
              }}
            >
              <HStack>
                <FaGraduationCap />
                <Text>
                  {selectedLessonId ? 
                    'Từ vựng' : 
                    `Bài học${lessons?.length ? ` (${lessons.length})` : ''}`
                  }
                </Text>
              </HStack>
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel>{renderStatistics()}</TabPanel>
            <TabPanel>{renderTopicsTable()}</TabPanel>
            <TabPanel>{selectedLessonId ? renderVocabularyTable() : renderLessonsTable()}</TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
      
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{getModalTitle()}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>{renderModalContent()}</VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Hủy
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleSubmit} 
              isLoading={loading.topics || loading.lessons || loading.vocabulary}
            >
              {editingItem ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <VocabularySearchModal
        isOpen={isSearchModalOpen}
        onClose={onSearchModalClose}
        lessonId={selectedLessonId}
        onAddSuccess={() => {
          if (selectedLessonId) {
            loadVocabularyPage(selectedLessonId, vocabularyPagination.current_page || 1);
          }
        }}
      />
    </Container>
  );
};

export default AdminPage;