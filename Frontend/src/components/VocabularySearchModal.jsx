import { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton,
  ModalBody, ModalFooter, Button, Input, InputGroup, InputLeftElement,
  VStack, HStack, Text, Badge, Table, Thead, Tbody, Tr, Th, Td,
  Box, IconButton, useToast, Spinner, Alert, AlertIcon
} from '@chakra-ui/react';
import { FaSearch, FaPlus, FaVolumeUp } from 'react-icons/fa';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import useAdminStore from '../store/adminStore';

const VocabularySearchModal = ({ isOpen, onClose, lessonId, onAddSuccess }) => {
  const { searchExistingVocabulary, addExistingVocabularyToLesson, loading } = useAdminStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) {
      setSearchKeyword('');
      setSearchResults([]);
      setPagination({});
      setCurrentPage(1);
      setHasSearched(false);
    }
  }, [isOpen]);

  const handleSearch = async (page = 1) => {
    if (!searchKeyword.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập từ khóa tìm kiếm",
        status: "error",
        duration: 3000
      });
      return;
    }

    try {
      setIsSearching(true);
      const result = await searchExistingVocabulary(searchKeyword.trim(), page, 8);
      setSearchResults(result.vocabulary || []);
      setPagination(result.pagination || {});
      setCurrentPage(page);
      setHasSearched(true);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Lỗi tìm kiếm",
        description: "Không thể tìm kiếm từ vựng",
        status: "error",
        duration: 3000
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddVocabulary = async (vocabId, word) => {
    try {
      await addExistingVocabularyToLesson(lessonId, vocabId);
      toast({
        title: "Thành công",
        description: `Đã thêm từ "${word}" vào bài học`,
        status: "success",
        duration: 3000
      });
      if (onAddSuccess) {
        onAddSuccess();
      }
      onClose();
    } catch (error) {
      console.error('Add vocabulary error:', error);
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || "Không thể thêm từ vựng vào bài học",
        status: "error",
        duration: 3000
      });
    }
  };

  const handlePageChange = (page) => {
    handleSearch(page);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Tìm kiếm từ vựng có sẵn</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <HStack>
              <InputGroup>
                <InputLeftElement><FaSearch color="gray.300" /></InputLeftElement>
                <Input
                  placeholder="Nhập từ vựng hoặc nghĩa..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </InputGroup>
              <Button
                colorScheme="blue"
                onClick={() => handleSearch()}
                isLoading={isSearching}
                loadingText="Đang tìm..."
              >
                Tìm kiếm
              </Button>
            </HStack>

            {isSearching && (
              <Box textAlign="center" py={4}>
                <Spinner size="lg" color="blue.500" />
                <Text mt={2}>Đang tìm kiếm...</Text>
              </Box>
            )}

            {hasSearched && !isSearching && searchResults.length === 0 && (
              <Alert status="info">
                <AlertIcon />
                Không tìm thấy từ vựng nào với từ khóa "{searchKeyword}"
              </Alert>
            )}

            {searchResults.length > 0 && (
              <>
                <Box overflowX="auto" borderRadius="lg" borderWidth="1px">
                  <Table variant="simple" size="sm">
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
                      {searchResults.map((vocab) => (
                        <Tr key={vocab.vocab_id}>
                          <Td>
                            <Text fontWeight="medium">{vocab.word}</Text>
                          </Td>
                          <Td>
                            <Text>{vocab.meaning}</Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm" color="gray.800" _dark={{ color: "gray.200" }}>{vocab.pronunciation}</Text>
                          </Td>
                          <Td>
                            <Badge 
                              colorScheme={
                                vocab.difficulty_level === 'easy' ? 'green' : 
                                vocab.difficulty_level === 'medium' ? 'yellow' : 'red'
                              }
                              size="sm"
                            >
                              {vocab.difficulty_level}
                            </Badge>
                          </Td>
                          <Td>
                            <Badge colorScheme="blue" size="sm">
                              {vocab.word_type}
                            </Badge>
                          </Td>
                          <Td>
                            <HStack spacing={1}>
                              {vocab.audio && (
                                <IconButton
                                  aria-label="Phát âm"
                                  icon={<FaVolumeUp />}
                                  size="xs"
                                  colorScheme="blue"
                                  variant="solid"
                                  onClick={() => new Audio(vocab.audio).play()}
                                />
                              )}
                              <IconButton
                                aria-label="Thêm vào bài học"
                                icon={<FaPlus />}
                                size="xs"
                                colorScheme="red"
                                onClick={() => handleAddVocabulary(vocab.vocab_id, vocab.word)}
                                isLoading={loading.vocabulary}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>

                {pagination.total_pages > 1 && (
                  <HStack justify="space-between" align="center">
                    <Text fontSize="sm">
                      Hiển thị {((pagination.current_page - 1) * pagination.items_per_page) + 1} - 
                      {Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items)} 
                      trên {pagination.total_items} từ vựng
                    </Text>
                    <HStack>
                      <IconButton
                        icon={<ChevronLeftIcon />}
                        aria-label="Trang trước"
                        size="sm"
                        isDisabled={!pagination.has_prev}
                        onClick={() => handlePageChange(pagination.current_page - 1)}
                      />
                      <Text fontSize="sm">
                        Trang {pagination.current_page} / {pagination.total_pages}
                      </Text>
                      <IconButton
                        icon={<ChevronRightIcon />}
                        aria-label="Trang sau"
                        size="sm"
                        isDisabled={!pagination.has_next}
                        onClick={() => handlePageChange(pagination.current_page + 1)}
                      />
                    </HStack>
                  </HStack>
                )}
              </>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Đóng</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default VocabularySearchModal;