    <?php
    class AdminController {
        private $db;
        private $topic;
        private $lesson;
        private $vocabulary;
        private $topicLesson;
        private $lessonVocabulary;

        public function __construct($db) {
            $this->db = $db;
            $this->topic = new Topic($db);
            $this->lesson = new Lesson($db);
            $this->vocabulary = new Vocabulary($db);
            $this->topicLesson = new TopicLesson($db);
            $this->lessonVocabulary = new LessonVocabulary($db);
        }

        public function getAllTopicsForAdmin() {
            try {
                $sql = "SELECT t.topic_id, t.topic_name, t.description, t.display_order, t.is_active, COUNT(tl.lesson_id) as lesson_count FROM Topics t LEFT JOIN TopicLessons tl ON t.topic_id = tl.topic_id GROUP BY t.topic_id, t.topic_name, t.description, t.display_order, t.is_active ORDER BY t.display_order";
                $stmt = $this->db->prepare($sql);
                $stmt->execute();
                $topics = $stmt->fetchAll(PDO::FETCH_ASSOC);
                return ['status' => 200, 'data' => $topics];
            } catch (Exception $e) {
                return ['status' => 500, 'message' => 'Lỗi: ' . $e->getMessage()];
            }
        }

        public function getAllLessonsForAdmin() {
            try {
                $sql = "SELECT l.lesson_id, l.title, l.display_order, l.is_active, MAX(tl.topic_id) as topic_id, MAX(t.topic_name) as topic_name, COUNT(lv.vocab_id) as vocab_count FROM Lessons l LEFT JOIN TopicLessons tl ON l.lesson_id = tl.lesson_id LEFT JOIN Topics t ON tl.topic_id = t.topic_id LEFT JOIN LessonVocabulary lv ON l.lesson_id = lv.lesson_id GROUP BY l.lesson_id, l.title, l.display_order, l.is_active ORDER BY l.display_order";
                $stmt = $this->db->prepare($sql);
                $stmt->execute();
                $lessons = $stmt->fetchAll(PDO::FETCH_ASSOC);
                return ['status' => 200, 'data' => $lessons];
            } catch (Exception $e) {
                return ['status' => 500, 'message' => 'Lỗi: ' . $e->getMessage()];
            }
        }

        public function getLessonVocabularyForAdmin($lesson_id, $page = 1, $limit = 50) {
            try {
                if (!$lesson_id || !is_numeric($lesson_id)) {
                    return ['status' => 400, 'message' => 'lesson_id không hợp lệ'];
                }
                $offset = ($page - 1) * $limit;
                $sql = "SELECT lv.*, v.word, v.meaning, v.pronunciation, v.example, v.difficulty_level, v.word_type, v.audio, l.title as lesson_title, t.topic_name FROM LessonVocabulary lv INNER JOIN Vocabulary v ON lv.vocab_id = v.vocab_id INNER JOIN Lessons l ON lv.lesson_id = l.lesson_id LEFT JOIN TopicLessons tl ON l.lesson_id = tl.lesson_id LEFT JOIN Topics t ON tl.topic_id = t.topic_id WHERE lv.lesson_id = :lesson_id ORDER BY lv.display_order LIMIT :limit OFFSET :offset";
                $stmt = $this->db->prepare($sql);
                $stmt->bindParam(':lesson_id', $lesson_id, PDO::PARAM_INT);
                $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
                $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
                $stmt->execute();
                $vocabulary = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $count_sql = "SELECT COUNT(*) as total FROM LessonVocabulary WHERE lesson_id = :lesson_id";
                $count_stmt = $this->db->prepare($count_sql);
                $count_stmt->bindParam(':lesson_id', $lesson_id, PDO::PARAM_INT);
                $count_stmt->execute();
                $total = $count_stmt->fetch(PDO::FETCH_ASSOC)['total'];
                return ['status' => 200, 'data' => ['vocabulary' => $vocabulary, 'pagination' => ['current_page' => $page, 'total_items' => intval($total), 'items_per_page' => $limit, 'total_pages' => ceil($total / $limit), 'has_next' => $page < ceil($total / $limit), 'has_prev' => $page > 1]]];
            } catch (Exception $e) {
                return ['status' => 500, 'message' => 'Lỗi: ' . $e->getMessage()];
            }
        }

        public function createTopic($data) {
            try {
                if (empty($data['topic_name']) || trim($data['topic_name']) === '') {
                    return ['status' => 400, 'message' => 'Tên chủ đề không được để trống'];
                }
                if (empty($data['description']) || trim($data['description']) === '') {
                    return ['status' => 400, 'message' => 'Mô tả chủ đề không được để trống'];
                }
                
                // FIX: Tạo biến trước khi bind
                $topic_name_trim = trim($data['topic_name']);
                $check_sql = "SELECT topic_id FROM Topics WHERE topic_name = :topic_name";
                $check_stmt = $this->db->prepare($check_sql);
                $check_stmt->bindParam(':topic_name', $topic_name_trim);
                $check_stmt->execute();
                if ($check_stmt->fetch(PDO::FETCH_ASSOC)) {
                    return ['status' => 409, 'message' => 'Tên chủ đề đã tồn tại'];
                }
                
                $display_order = $this->getNextTopicOrder();
                $is_active = isset($data['is_active']) ? (int)$data['is_active'] : 1;
                $description_trim = trim($data['description']);
                
                $sql = "INSERT INTO Topics (topic_name, description, display_order, is_active) VALUES (:topic_name, :description, :display_order, :is_active)";
                $stmt = $this->db->prepare($sql);
                $stmt->bindParam(':topic_name', $topic_name_trim);
                $stmt->bindParam(':description', $description_trim);
                $stmt->bindParam(':display_order', $display_order, PDO::PARAM_INT);
                $stmt->bindParam(':is_active', $is_active, PDO::PARAM_INT);
                
                if ($stmt->execute()) {
                    $topic_id = $this->db->lastInsertId();
                    return ['status' => 201, 'message' => 'Tạo chủ đề thành công', 'data' => ['topic_id' => $topic_id]];
                }
                return ['status' => 500, 'message' => 'Không thể tạo chủ đề'];
            } catch (Exception $e) {
                return ['status' => 500, 'message' => 'Lỗi: ' . $e->getMessage()];
            }
        }

        public function updateTopic($topic_id, $data) {
            try {
                if (!is_numeric($topic_id) || $topic_id <= 0) {
                    return ['status' => 400, 'message' => 'ID chủ đề không hợp lệ'];
                }
                
                $updates = [];
                $params = [':topic_id' => intval($topic_id)];
                
                if (isset($data['topic_name'])) {
                    if (empty($data['topic_name']) || trim($data['topic_name']) === '') {
                        return ['status' => 400, 'message' => 'Tên chủ đề không được để trống'];
                    }
                    
                    // FIX: Tạo biến trước khi bind
                    $topic_name_trim = trim($data['topic_name']);
                    $topic_id_int = intval($topic_id);
                    
                    $check_sql = "SELECT topic_id FROM Topics WHERE topic_name = :topic_name AND topic_id != :topic_id";
                    $check_stmt = $this->db->prepare($check_sql);
                    $check_stmt->bindParam(':topic_name', $topic_name_trim);
                    $check_stmt->bindParam(':topic_id', $topic_id_int);
                    $check_stmt->execute();
                    
                    if ($check_stmt->fetch(PDO::FETCH_ASSOC)) {
                        return ['status' => 409, 'message' => 'Tên chủ đề đã tồn tại'];
                    }
                    $updates[] = "topic_name = :topic_name";
                    $params[':topic_name'] = $topic_name_trim;
                }
                
                if (isset($data['description'])) {
                    if (empty($data['description']) || trim($data['description']) === '') {
                        return ['status' => 400, 'message' => 'Mô tả chủ đề không được để trống'];
                    }
                    $updates[] = "description = :description";
                    $params[':description'] = trim($data['description']);
                }
                
                if (isset($data['is_active'])) {
                    $updates[] = "is_active = :is_active";
                    $params[':is_active'] = (int)$data['is_active'];
                }
                
                if (empty($updates)) {
                    return ['status' => 400, 'message' => 'Không có dữ liệu để cập nhật'];
                }
                
                $sql = "UPDATE Topics SET " . implode(', ', $updates) . " WHERE topic_id = :topic_id";
                $stmt = $this->db->prepare($sql);
                
                if ($stmt->execute($params)) {
                    return ['status' => 200, 'message' => 'Cập nhật chủ đề thành công'];
                }
                return ['status' => 500, 'message' => 'Không thể cập nhật chủ đề'];
            } catch (Exception $e) {
                return ['status' => 500, 'message' => 'Lỗi: ' . $e->getMessage()];
            }
        }

        public function deleteTopic($topic_id) {
            try {
                if (!is_numeric($topic_id) || $topic_id <= 0) {
                    return ['status' => 400, 'message' => 'ID chủ đề không hợp lệ'];
                }
                
                $this->db->beginTransaction();
                $topic_id_int = intval($topic_id);
                
                $sql = "DELETE FROM TopicLessons WHERE topic_id = :topic_id";
                $stmt = $this->db->prepare($sql);
                $stmt->bindParam(':topic_id', $topic_id_int, PDO::PARAM_INT);
                $stmt->execute();
                
                $sql = "DELETE FROM Topics WHERE topic_id = :topic_id";
                $stmt = $this->db->prepare($sql);
                $stmt->bindParam(':topic_id', $topic_id_int, PDO::PARAM_INT);
                
                if ($stmt->execute()) {
                    $this->db->commit();
                    return ['status' => 200, 'message' => 'Xóa chủ đề thành công'];
                }
                $this->db->rollback();
                return ['status' => 500, 'message' => 'Không thể xóa chủ đề'];
            } catch (Exception $e) {
                $this->db->rollback();
                return ['status' => 500, 'message' => 'Lỗi: ' . $e->getMessage()];
            }
        }

        public function createLesson($data) {
            try {
                error_log("Creating lesson with data: " . json_encode($data));
                
                if (empty($data['title']) || trim($data['title']) === '') {
                    return ['status' => 400, 'message' => 'Tiêu đề bài học không được để trống'];
                }
                if (isset($data['topic_id']) && !empty($data['topic_id']) && (!is_numeric($data['topic_id']) || $data['topic_id'] <= 0)) {
                    return ['status' => 400, 'message' => 'ID chủ đề không hợp lệ'];
                }
                
                // FIX: Tạo biến trước khi bind
                $title_trim = trim($data['title']);
                $check_sql = "SELECT lesson_id FROM Lessons WHERE title = :title";
                $check_stmt = $this->db->prepare($check_sql);
                $check_stmt->bindParam(':title', $title_trim);
                $check_stmt->execute();
                
                if ($check_stmt->fetch(PDO::FETCH_ASSOC)) {
                    return ['status' => 409, 'message' => 'Tiêu đề bài học đã tồn tại'];
                }
                
                $this->db->beginTransaction();
                
                $display_order = $this->getNextLessonOrder();
                $is_active = isset($data['is_active']) ? (int)$data['is_active'] : 1;
                
                $sql = "INSERT INTO Lessons (title, display_order, is_active) VALUES (:title, :display_order, :is_active)";
                $stmt = $this->db->prepare($sql);
                $stmt->bindParam(':title', $title_trim);
                $stmt->bindParam(':display_order', $display_order, PDO::PARAM_INT);
                $stmt->bindParam(':is_active', $is_active, PDO::PARAM_INT);
                
                if ($stmt->execute()) {
                    $lesson_id = $this->db->lastInsertId();
                    error_log("Lesson created with ID: " . $lesson_id);
                    
                    // Gán vào topic nếu có
                    if (isset($data['topic_id']) && !empty($data['topic_id']) && is_numeric($data['topic_id'])) {
                        $topic_id_int = intval($data['topic_id']);
                        
                        $topic_check_sql = "SELECT topic_id FROM Topics WHERE topic_id = :topic_id";
                        $topic_check_stmt = $this->db->prepare($topic_check_sql);
                        $topic_check_stmt->bindParam(':topic_id', $topic_id_int, PDO::PARAM_INT);
                        $topic_check_stmt->execute();
                        
                        if ($topic_check_stmt->fetch(PDO::FETCH_ASSOC)) {
                            $sql = "INSERT INTO TopicLessons (topic_id, lesson_id) VALUES (:topic_id, :lesson_id)";
                            $stmt = $this->db->prepare($sql);
                            $stmt->bindParam(':topic_id', $topic_id_int, PDO::PARAM_INT);
                            $stmt->bindParam(':lesson_id', $lesson_id, PDO::PARAM_INT);
                            $stmt->execute();
                            error_log("Lesson assigned to topic: " . $topic_id_int);
                        }
                    }
                    
                    $this->db->commit();
                    return ['status' => 201, 'message' => 'Tạo bài học thành công', 'data' => ['lesson_id' => $lesson_id]];
                }
                
                $this->db->rollback();
                return ['status' => 500, 'message' => 'Không thể tạo bài học'];
            } catch (Exception $e) {
                $this->db->rollback();
                error_log("Create lesson error: " . $e->getMessage());
                return ['status' => 500, 'message' => 'Lỗi: ' . $e->getMessage()];
            }
        }

        public function updateLesson($lesson_id, $data) {
            try {
                if (!is_numeric($lesson_id) || $lesson_id <= 0) {
                    return ['status' => 400, 'message' => 'ID bài học không hợp lệ'];
                }
                
                $this->db->beginTransaction();
                $updates = [];
                $params = [':lesson_id' => intval($lesson_id)];
                
                if (isset($data['title'])) {
                    if (empty($data['title']) || trim($data['title']) === '') {
                        return ['status' => 400, 'message' => 'Tiêu đề bài học không được để trống'];
                    }
                    
                    // FIX: Tạo biến trước khi bind
                    $title_trim = trim($data['title']);
                    $lesson_id_int = intval($lesson_id);
                    
                    $check_sql = "SELECT lesson_id FROM Lessons WHERE title = :title AND lesson_id != :lesson_id";
                    $check_stmt = $this->db->prepare($check_sql);
                    $check_stmt->bindParam(':title', $title_trim);
                    $check_stmt->bindParam(':lesson_id', $lesson_id_int);
                    $check_stmt->execute();
                    
                    if ($check_stmt->fetch(PDO::FETCH_ASSOC)) {
                        return ['status' => 409, 'message' => 'Tiêu đề bài học đã tồn tại'];
                    }
                    $updates[] = "title = :title";
                    $params[':title'] = $title_trim;
                }
                
                if (isset($data['is_active'])) {
                    $updates[] = "is_active = :is_active";
                    $params[':is_active'] = (int)$data['is_active'];
                }
                
                if (!empty($updates)) {
                    $sql = "UPDATE Lessons SET " . implode(', ', $updates) . " WHERE lesson_id = :lesson_id";
                    $stmt = $this->db->prepare($sql);
                    $stmt->execute($params);
                }
                
                if (isset($data['topic_id'])) {
                    if (!empty($data['topic_id']) && (!is_numeric($data['topic_id']) || $data['topic_id'] <= 0)) {
                        return ['status' => 400, 'message' => 'ID chủ đề không hợp lệ'];
                    }
                    
                    $lesson_id_int = intval($lesson_id);
                    
                    $sql = "DELETE FROM TopicLessons WHERE lesson_id = :lesson_id";
                    $stmt = $this->db->prepare($sql);
                    $stmt->bindParam(':lesson_id', $lesson_id_int, PDO::PARAM_INT);
                    $stmt->execute();
                    
                    if (!empty($data['topic_id']) && is_numeric($data['topic_id'])) {
                        $topic_id_int = intval($data['topic_id']);
                        
                        $topic_check_sql = "SELECT topic_id FROM Topics WHERE topic_id = :topic_id";
                        $topic_check_stmt = $this->db->prepare($topic_check_sql);
                        $topic_check_stmt->bindParam(':topic_id', $topic_id_int, PDO::PARAM_INT);
                        $topic_check_stmt->execute();
                        
                        if ($topic_check_stmt->fetch(PDO::FETCH_ASSOC)) {
                            $sql = "INSERT INTO TopicLessons (topic_id, lesson_id) VALUES (:topic_id, :lesson_id)";
                            $stmt = $this->db->prepare($sql);
                            $stmt->bindParam(':topic_id', $topic_id_int, PDO::PARAM_INT);
                            $stmt->bindParam(':lesson_id', $lesson_id_int, PDO::PARAM_INT);
                            $stmt->execute();
                        }
                    }
                }
                
                $this->db->commit();
                return ['status' => 200, 'message' => 'Cập nhật bài học thành công'];
            } catch (Exception $e) {
                $this->db->rollback();
                return ['status' => 500, 'message' => 'Lỗi: ' . $e->getMessage()];
            }
        }

        public function deleteLesson($lesson_id) {
            try {
                if (!is_numeric($lesson_id) || $lesson_id <= 0) {
                    return ['status' => 400, 'message' => 'ID bài học không hợp lệ'];
                }
                
                $this->db->beginTransaction();
                $lesson_id_int = intval($lesson_id);
                
                $sql = "DELETE FROM LessonVocabulary WHERE lesson_id = :lesson_id";
                $stmt = $this->db->prepare($sql);
                $stmt->bindParam(':lesson_id', $lesson_id_int, PDO::PARAM_INT);
                $stmt->execute();
                
                $sql = "DELETE FROM TopicLessons WHERE lesson_id = :lesson_id";
                $stmt = $this->db->prepare($sql);
                $stmt->bindParam(':lesson_id', $lesson_id_int, PDO::PARAM_INT);
                $stmt->execute();
                
                $sql = "DELETE FROM Lessons WHERE lesson_id = :lesson_id";
                $stmt = $this->db->prepare($sql);
                $stmt->bindParam(':lesson_id', $lesson_id_int, PDO::PARAM_INT);
                
                if ($stmt->execute()) {
                    $this->db->commit();
                    return ['status' => 200, 'message' => 'Xóa bài học thành công'];
                }
                $this->db->rollback();
                return ['status' => 500, 'message' => 'Không thể xóa bài học'];
            } catch (Exception $e) {
                $this->db->rollback();
                return ['status' => 500, 'message' => 'Lỗi: ' . $e->getMessage()];
            }
        }

        public function addVocabularyToLesson($data) {
            try {
                error_log("Adding vocabulary with data: " . json_encode($data));
                
                if (empty($data['lesson_id']) || !is_numeric($data['lesson_id']) || $data['lesson_id'] <= 0) {
                    return ['status' => 400, 'message' => 'ID bài học không hợp lệ'];
                }
                if (empty($data['word']) || trim($data['word']) === '') {
                    return ['status' => 400, 'message' => 'Từ vựng không được để trống'];
                }
                if (empty($data['meaning']) || trim($data['meaning']) === '') {
                    return ['status' => 400, 'message' => 'Nghĩa của từ không được để trống'];
                }
                if (empty($data['pronunciation']) || trim($data['pronunciation']) === '') {
                    return ['status' => 400, 'message' => 'Phát âm không được để trống'];
                }
                if (empty($data['word_type']) || trim($data['word_type']) === '') {
                    return ['status' => 400, 'message' => 'Loại từ không được để trống'];
                }
                if (empty($data['difficulty_level']) || !in_array($data['difficulty_level'], ['Easy', 'Medium', 'Hard'])) {
                    return ['status' => 400, 'message' => 'Độ khó phải là easy, medium hoặc hard'];
                }
                
                $lesson_id_int = intval($data['lesson_id']);
                
                $lesson_check_sql = "SELECT lesson_id FROM Lessons WHERE lesson_id = :lesson_id";
                $lesson_check_stmt = $this->db->prepare($lesson_check_sql);
                $lesson_check_stmt->bindParam(':lesson_id', $lesson_id_int, PDO::PARAM_INT);
                $lesson_check_stmt->execute();
                
                if (!$lesson_check_stmt->fetch(PDO::FETCH_ASSOC)) {
                    return ['status' => 404, 'message' => 'Bài học không tồn tại'];
                }
                
                $this->db->beginTransaction();
                
                $word_trim = trim($data['word']);
                $check_sql = "SELECT vocab_id FROM Vocabulary WHERE word = :word";
                $check_stmt = $this->db->prepare($check_sql);
                $check_stmt->bindParam(':word', $word_trim);
                $check_stmt->execute();
                $existing_vocab = $check_stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($existing_vocab) {
                    $vocab_id = $existing_vocab['vocab_id'];
                    error_log("Found existing vocabulary with ID: " . $vocab_id);
                    
                    $lesson_vocab_check_sql = "SELECT COUNT(*) as count FROM LessonVocabulary WHERE lesson_id = :lesson_id AND vocab_id = :vocab_id";
                    $lesson_vocab_check_stmt = $this->db->prepare($lesson_vocab_check_sql);
                    $lesson_vocab_check_stmt->bindParam(':lesson_id', $lesson_id_int, PDO::PARAM_INT);
                    $lesson_vocab_check_stmt->bindParam(':vocab_id', $vocab_id, PDO::PARAM_INT);
                    $lesson_vocab_check_stmt->execute();
                    
                    if ($lesson_vocab_check_stmt->fetch(PDO::FETCH_ASSOC)['count'] > 0) {
                        $this->db->rollback();
                        return ['status' => 409, 'message' => 'Từ vựng này đã tồn tại trong bài học'];
                    }
                    
                    $display_order = $this->getNextVocabOrder($lesson_id_int);
                    $custom_meaning = isset($data['custom_meaning']) ? trim($data['custom_meaning']) : null;
                    $custom_example = isset($data['custom_example']) ? trim($data['custom_example']) : null;
                    
                    $lesson_vocab_sql = "INSERT INTO LessonVocabulary (lesson_id, vocab_id, display_order, custom_meaning, custom_example) VALUES (:lesson_id, :vocab_id, :display_order, :custom_meaning, :custom_example)";
                    $lesson_vocab_stmt = $this->db->prepare($lesson_vocab_sql);
                    $lesson_vocab_stmt->bindParam(':lesson_id', $lesson_id_int, PDO::PARAM_INT);
                    $lesson_vocab_stmt->bindParam(':vocab_id', $vocab_id, PDO::PARAM_INT);
                    $lesson_vocab_stmt->bindParam(':display_order', $display_order, PDO::PARAM_INT);
                    $lesson_vocab_stmt->bindParam(':custom_meaning', $custom_meaning);
                    $lesson_vocab_stmt->bindParam(':custom_example', $custom_example);
                    $lesson_vocab_stmt->execute();
                    
                    $this->db->commit();
                    error_log("Successfully added existing vocabulary to lesson");
                    return [
                        'status' => 201, 
                        'message' => 'Đã thêm từ vựng có sẵn vào bài học thành công', 
                        'data' => ['vocab_id' => $vocab_id, 'existing' => true]
                    ];
                } else {
                    $meaning_trim = trim($data['meaning']);
                    $pronunciation_trim = trim($data['pronunciation']);
                    $word_type_trim = trim($data['word_type']);
                    $example_trim = isset($data['example']) ? trim($data['example']) : '';
                    $audio_trim = isset($data['audio']) ? trim($data['audio']) : '';
                    
                    $vocab_sql = "INSERT INTO Vocabulary (word, meaning, pronunciation, example, difficulty_level, word_type, audio) VALUES (:word, :meaning, :pronunciation, :example, :difficulty_level, :word_type, :audio)";
                    $vocab_stmt = $this->db->prepare($vocab_sql);
                    $vocab_stmt->bindParam(':word', $word_trim);
                    $vocab_stmt->bindParam(':meaning', $meaning_trim);
                    $vocab_stmt->bindParam(':pronunciation', $pronunciation_trim);
                    $vocab_stmt->bindParam(':example', $example_trim);
                    $vocab_stmt->bindParam(':difficulty_level', $data['difficulty_level']);
                    $vocab_stmt->bindParam(':word_type', $word_type_trim);
                    $vocab_stmt->bindParam(':audio', $audio_trim);
                    $vocab_stmt->execute();
                    
                    $vocab_id = $this->db->lastInsertId();
                    error_log("Created new vocabulary with ID: " . $vocab_id);
                    
                    $display_order = $this->getNextVocabOrder($lesson_id_int);
                    $custom_meaning = isset($data['custom_meaning']) ? trim($data['custom_meaning']) : null;
                    $custom_example = isset($data['custom_example']) ? trim($data['custom_example']) : null;
                    
                    $lesson_vocab_sql = "INSERT INTO LessonVocabulary (lesson_id, vocab_id, display_order, custom_meaning, custom_example) VALUES (:lesson_id, :vocab_id, :display_order, :custom_meaning, :custom_example)";
                    $lesson_vocab_stmt = $this->db->prepare($lesson_vocab_sql);
                    $lesson_vocab_stmt->bindParam(':lesson_id', $lesson_id_int, PDO::PARAM_INT);
                    $lesson_vocab_stmt->bindParam(':vocab_id', $vocab_id, PDO::PARAM_INT);
                    $lesson_vocab_stmt->bindParam(':display_order', $display_order, PDO::PARAM_INT);
                    $lesson_vocab_stmt->bindParam(':custom_meaning', $custom_meaning);
                    $lesson_vocab_stmt->bindParam(':custom_example', $custom_example);
                    $lesson_vocab_stmt->execute();
                    
                    $this->db->commit();
                    error_log("Successfully created new vocabulary and added to lesson");
                    return [
                        'status' => 201, 
                        'message' => 'Tạo từ vựng mới và thêm vào bài học thành công', 
                        'data' => ['vocab_id' => $vocab_id, 'existing' => false]
                    ];
                }
            } catch (Exception $e) {
                $this->db->rollback();
                error_log("Add vocabulary error: " . $e->getMessage());
                return ['status' => 500, 'message' => 'Lỗi: ' . $e->getMessage()];
            }
        }

        public function searchExistingVocabulary($keyword, $page = 1, $limit = 10) {
            try {
                if (empty($keyword) || trim($keyword) === '') {
                    return ['status' => 400, 'message' => 'Từ khóa tìm kiếm không được để trống'];
                }
                
                $offset = ($page - 1) * $limit;
                $search_term = '%' . trim($keyword) . '%';
                $limit_int = intval($limit);
                $offset_int = intval($offset);
                
                $sql = "SELECT vocab_id, word, meaning, pronunciation, difficulty_level, word_type, audio FROM Vocabulary WHERE word LIKE :keyword OR meaning LIKE :keyword ORDER BY word LIMIT :limit OFFSET :offset";
                $stmt = $this->db->prepare($sql);
                $stmt->bindParam(':keyword', $search_term);
                $stmt->bindParam(':limit', $limit_int, PDO::PARAM_INT);
                $stmt->bindParam(':offset', $offset_int, PDO::PARAM_INT);
                $stmt->execute();
                $vocabulary = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                $count_sql = "SELECT COUNT(*) as total FROM Vocabulary WHERE word LIKE :keyword OR meaning LIKE :keyword";
                $count_stmt = $this->db->prepare($count_sql);
                $count_stmt->bindParam(':keyword', $search_term);
                $count_stmt->execute();
                $total = $count_stmt->fetch(PDO::FETCH_ASSOC)['total'];
                
                return [
                    'status' => 200, 
                    'data' => [
                        'vocabulary' => $vocabulary,
                        'pagination' => [
                            'current_page' => $page,
                            'total_items' => intval($total),
                            'items_per_page' => $limit,
                            'total_pages' => ceil($total / $limit),
                            'has_next' => $page < ceil($total / $limit),
                            'has_prev' => $page > 1
                        ],
                        'search_keyword' => $keyword
                    ]
                ];
            } catch (Exception $e) {
                return ['status' => 500, 'message' => 'Lỗi tìm kiếm: ' . $e->getMessage()];
            }
        }

        public function addExistingVocabularyToLesson($lesson_id, $vocab_id) {
            try {
                if (!is_numeric($lesson_id) || $lesson_id <= 0) {
                    return ['status' => 400, 'message' => 'ID bài học không hợp lệ'];
                }
                if (!is_numeric($vocab_id) || $vocab_id <= 0) {
                    return ['status' => 400, 'message' => 'ID từ vựng không hợp lệ'];
                }
                
                $lesson_id_int = intval($lesson_id);
                $vocab_id_int = intval($vocab_id);
                
                // Check if lesson exists
                $lesson_check_sql = "SELECT lesson_id FROM Lessons WHERE lesson_id = :lesson_id";
                $lesson_check_stmt = $this->db->prepare($lesson_check_sql);
                $lesson_check_stmt->bindParam(':lesson_id', $lesson_id_int, PDO::PARAM_INT);
                $lesson_check_stmt->execute();
                
                if (!$lesson_check_stmt->fetch(PDO::FETCH_ASSOC)) {
                    return ['status' => 404, 'message' => 'Bài học không tồn tại'];
                }
                
                // Check if vocabulary exists
                $vocab_check_sql = "SELECT vocab_id FROM Vocabulary WHERE vocab_id = :vocab_id";
                $vocab_check_stmt = $this->db->prepare($vocab_check_sql);
                $vocab_check_stmt->bindParam(':vocab_id', $vocab_id_int, PDO::PARAM_INT);
                $vocab_check_stmt->execute();
                
                if (!$vocab_check_stmt->fetch(PDO::FETCH_ASSOC)) {
                    return ['status' => 404, 'message' => 'Từ vựng không tồn tại'];
                }
                
                // Check if already in lesson
                $lesson_vocab_check_sql = "SELECT COUNT(*) as count FROM LessonVocabulary WHERE lesson_id = :lesson_id AND vocab_id = :vocab_id";
                $lesson_vocab_check_stmt = $this->db->prepare($lesson_vocab_check_sql);
                $lesson_vocab_check_stmt->bindParam(':lesson_id', $lesson_id_int, PDO::PARAM_INT);
                $lesson_vocab_check_stmt->bindParam(':vocab_id', $vocab_id_int, PDO::PARAM_INT);
                $lesson_vocab_check_stmt->execute();
                
                if ($lesson_vocab_check_stmt->fetch(PDO::FETCH_ASSOC)['count'] > 0) {
                    return ['status' => 409, 'message' => 'Từ vựng đã tồn tại trong bài học này'];
                }
                
                $display_order = $this->getNextVocabOrder($lesson_id_int);
                
                $lesson_vocab_sql = "INSERT INTO LessonVocabulary (lesson_id, vocab_id, display_order, custom_meaning, custom_example) VALUES (:lesson_id, :vocab_id, :display_order, NULL, NULL)";
                $lesson_vocab_stmt = $this->db->prepare($lesson_vocab_sql);
                $lesson_vocab_stmt->bindParam(':lesson_id', $lesson_id_int, PDO::PARAM_INT);
                $lesson_vocab_stmt->bindParam(':vocab_id', $vocab_id_int, PDO::PARAM_INT);
                $lesson_vocab_stmt->bindParam(':display_order', $display_order, PDO::PARAM_INT);
                $lesson_vocab_stmt->execute();
                
                return ['status' => 201, 'message' => 'Thêm từ vựng có sẵn vào bài học thành công'];
            } catch (Exception $e) {
                return ['status' => 500, 'message' => 'Lỗi: ' . $e->getMessage()];
            }
        }
            
        public function updateLessonVocabulary($lesson_id, $vocab_id, $data) {
            try {
                if (!is_numeric($lesson_id) || $lesson_id <= 0) {
                    return ['status' => 400, 'message' => 'ID bài học không hợp lệ'];
                }
                if (!is_numeric($vocab_id) || $vocab_id <= 0) {
                    return ['status' => 400, 'message' => 'ID từ vựng không hợp lệ'];
                }
                
                $this->db->beginTransaction();
                
                if (isset($data['word']) || isset($data['meaning']) || isset($data['pronunciation']) || isset($data['example']) || isset($data['difficulty_level']) || isset($data['word_type']) || isset($data['audio'])) {
                    $vocab_updates = [];
                    $vocab_params = [':vocab_id' => intval($vocab_id)];
                    
                    if (isset($data['word'])) {
                        if (empty($data['word']) || trim($data['word']) === '') {
                            return ['status' => 400, 'message' => 'Từ vựng không được để trống'];
                        }
                        
                        // FIX: Tạo biến trước khi bind
                        $word_trim = trim($data['word']);
                        $vocab_id_int = intval($vocab_id);
                        
                        $check_sql = "SELECT vocab_id FROM Vocabulary WHERE word = :word AND vocab_id != :vocab_id";
                        $check_stmt = $this->db->prepare($check_sql);
                        $check_stmt->bindParam(':word', $word_trim);
                        $check_stmt->bindParam(':vocab_id', $vocab_id_int);
                        $check_stmt->execute();
                        
                        if ($check_stmt->fetch(PDO::FETCH_ASSOC)) {
                            return ['status' => 409, 'message' => 'Từ vựng đã tồn tại'];
                        }
                        $vocab_updates[] = "word = :word";
                        $vocab_params[':word'] = $word_trim;
                    }
                    
                    if (isset($data['meaning'])) {
                        if (empty($data['meaning']) || trim($data['meaning']) === '') {
                            return ['status' => 400, 'message' => 'Nghĩa của từ không được để trống'];
                        }
                        $vocab_updates[] = "meaning = :meaning";
                        $vocab_params[':meaning'] = trim($data['meaning']);
                    }
                    
                    if (isset($data['pronunciation'])) {
                        if (empty($data['pronunciation']) || trim($data['pronunciation']) === '') {
                            return ['status' => 400, 'message' => 'Phát âm không được để trống'];
                        }
                        $vocab_updates[] = "pronunciation = :pronunciation";
                        $vocab_params[':pronunciation'] = trim($data['pronunciation']);
                    }
                    
                    if (isset($data['example'])) {
                        $vocab_updates[] = "example = :example";
                        $vocab_params[':example'] = trim($data['example']);
                    }
                    
                    if (isset($data['difficulty_level'])) {
                        if (!in_array($data['difficulty_level'], ['easy', 'medium', 'hard'])) {
                            return ['status' => 400, 'message' => 'Độ khó phải là easy, medium hoặc hard'];
                        }
                        $vocab_updates[] = "difficulty_level = :difficulty_level";
                        $vocab_params[':difficulty_level'] = $data['difficulty_level'];
                    }
                    
                    if (isset($data['word_type'])) {
                        if (empty($data['word_type']) || trim($data['word_type']) === '') {
                            return ['status' => 400, 'message' => 'Loại từ không được để trống'];
                        }
                        $vocab_updates[] = "word_type = :word_type";
                        $vocab_params[':word_type'] = trim($data['word_type']);
                    }
                    
                    if (isset($data['audio'])) {
                        $vocab_updates[] = "audio = :audio";
                        $vocab_params[':audio'] = trim($data['audio']);
                    }
                    
                    if (!empty($vocab_updates)) {
                        $vocab_sql = "UPDATE Vocabulary SET " . implode(', ', $vocab_updates) . " WHERE vocab_id = :vocab_id";
                        $vocab_stmt = $this->db->prepare($vocab_sql);
                        $vocab_stmt->execute($vocab_params);
                    }
                }
                
                if (isset($data['custom_meaning']) || isset($data['custom_example'])) {
                    $lv_updates = [];
                    $lv_params = [':lesson_id' => intval($lesson_id), ':vocab_id' => intval($vocab_id)];
                    
                    if (isset($data['custom_meaning'])) {
                        $lv_updates[] = "custom_meaning = :custom_meaning";
                        $lv_params[':custom_meaning'] = trim($data['custom_meaning']);
                    }
                    
                    if (isset($data['custom_example'])) {
                        $lv_updates[] = "custom_example = :custom_example";
                        $lv_params[':custom_example'] = trim($data['custom_example']);
                    }
                    
                    if (!empty($lv_updates)) {
                        $lv_sql = "UPDATE LessonVocabulary SET " . implode(', ', $lv_updates) . " WHERE lesson_id = :lesson_id AND vocab_id = :vocab_id";
                        $lv_stmt = $this->db->prepare($lv_sql);
                        $lv_stmt->execute($lv_params);
                    }
                }
                
                $this->db->commit();
                return ['status' => 200, 'message' => 'Cập nhật từ vựng thành công'];
            } catch (Exception $e) {
                $this->db->rollback();
                return ['status' => 500, 'message' => 'Lỗi: ' . $e->getMessage()];
            }
        }

        public function removeLessonVocabulary($lesson_id, $vocab_id) {
            try {
                if (!is_numeric($lesson_id) || $lesson_id <= 0) {
                    return ['status' => 400, 'message' => 'ID bài học không hợp lệ'];
                }
                if (!is_numeric($vocab_id) || $vocab_id <= 0) {
                    return ['status' => 400, 'message' => 'ID từ vựng không hợp lệ'];
                }
                
                $lesson_id_int = intval($lesson_id);
                $vocab_id_int = intval($vocab_id);
                
                $sql = "DELETE FROM LessonVocabulary WHERE lesson_id = :lesson_id AND vocab_id = :vocab_id";
                $stmt = $this->db->prepare($sql);
                $stmt->bindParam(':lesson_id', $lesson_id_int, PDO::PARAM_INT);
                $stmt->bindParam(':vocab_id', $vocab_id_int, PDO::PARAM_INT);
                
                if ($stmt->execute()) {
                    return ['status' => 200, 'message' => 'Xóa từ vựng khỏi bài học thành công'];
                }
                return ['status' => 500, 'message' => 'Không thể xóa từ vựng'];
            } catch (Exception $e) {
                return ['status' => 500, 'message' => 'Lỗi: ' . $e->getMessage()];
            }
        }

        public function searchLessonVocabulary($lesson_id, $keyword, $page = 1, $limit = 50) {
            try {
                if (!is_numeric($lesson_id) || $lesson_id <= 0) {
                    return ['status' => 400, 'message' => 'ID bài học không hợp lệ'];
                }
                
                $offset = ($page - 1) * $limit;
                $search_term = '%' . $keyword . '%';
                $lesson_id_int = intval($lesson_id);
                $limit_int = intval($limit);
                $offset_int = intval($offset);
                
                $sql = "SELECT lv.*, v.word, v.meaning, v.pronunciation, v.example, v.difficulty_level, v.word_type, v.audio FROM LessonVocabulary lv INNER JOIN Vocabulary v ON lv.vocab_id = v.vocab_id WHERE lv.lesson_id = :lesson_id AND (v.word LIKE :keyword OR v.meaning LIKE :keyword) ORDER BY lv.display_order LIMIT :limit OFFSET :offset";
                $stmt = $this->db->prepare($sql);
                $stmt->bindParam(':lesson_id', $lesson_id_int, PDO::PARAM_INT);
                $stmt->bindParam(':keyword', $search_term);
                $stmt->bindParam(':limit', $limit_int, PDO::PARAM_INT);
                $stmt->bindParam(':offset', $offset_int, PDO::PARAM_INT);
                $stmt->execute();
                $vocabulary = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                $count_sql = "SELECT COUNT(*) as total FROM LessonVocabulary lv INNER JOIN Vocabulary v ON lv.vocab_id = v.vocab_id WHERE lv.lesson_id = :lesson_id AND (v.word LIKE :keyword OR v.meaning LIKE :keyword)";
                $count_stmt = $this->db->prepare($count_sql);
                $count_stmt->bindParam(':lesson_id', $lesson_id_int, PDO::PARAM_INT);
                $count_stmt->bindParam(':keyword', $search_term);
                $count_stmt->execute();
                $total = $count_stmt->fetch(PDO::FETCH_ASSOC)['total'];
                
                return ['status' => 200, 'data' => ['vocabulary' => $vocabulary, 'pagination' => ['current_page' => $page, 'total_items' => intval($total), 'items_per_page' => $limit, 'total_pages' => ceil($total / $limit), 'has_next' => $page < ceil($total / $limit), 'has_prev' => $page > 1], 'search_keyword' => $keyword]];
            } catch (Exception $e) {
                return ['status' => 500, 'message' => 'Lỗi tìm kiếm: ' . $e->getMessage()];
            }
        }

        public function getAdminStatistics() {
            try {
                $stats = [];
                
                $sql = "SELECT COUNT(*) as total_topics FROM Topics";
                $stmt = $this->db->prepare($sql);
                $stmt->execute();
                $stats['total_topics'] = $stmt->fetch(PDO::FETCH_ASSOC)['total_topics'];
                
                $sql = "SELECT COUNT(*) as total_lessons FROM Lessons";
                $stmt = $this->db->prepare($sql);
                $stmt->execute();
                $stats['total_lessons'] = $stmt->fetch(PDO::FETCH_ASSOC)['total_lessons'];
                
                $sql = "SELECT COUNT(*) as total_vocabulary FROM Vocabulary";
                $stmt = $this->db->prepare($sql);
                $stmt->execute();
                $stats['total_vocabulary'] = $stmt->fetch(PDO::FETCH_ASSOC)['total_vocabulary'];
                
                $sql = "SELECT COUNT(*) as total_users FROM Users";
                $stmt = $this->db->prepare($sql);
                $stmt->execute();
                $stats['total_users'] = $stmt->fetch(PDO::FETCH_ASSOC)['total_users'];
                
                $sql = "SELECT COUNT(*) as active_topics FROM Topics WHERE is_active = 1";
                $stmt = $this->db->prepare($sql);
                $stmt->execute();
                $stats['active_topics'] = $stmt->fetch(PDO::FETCH_ASSOC)['active_topics'];
                
                $sql = "SELECT COUNT(*) as active_lessons FROM Lessons WHERE is_active = 1";
                $stmt = $this->db->prepare($sql);
                $stmt->execute();
                $stats['active_lessons'] = $stmt->fetch(PDO::FETCH_ASSOC)['active_lessons'];
                
                return ['status' => 200, 'data' => $stats];
            } catch (Exception $e) {
                return ['status' => 500, 'message' => 'Lỗi lấy thống kê: ' . $e->getMessage()];
            }
        }

        public function searchTopics($keyword) {
            try {
                $search_term = '%' . $keyword . '%';
                $sql = "SELECT t.topic_id, t.topic_name, t.description, t.display_order, t.is_active, COUNT(tl.lesson_id) as lesson_count FROM Topics t LEFT JOIN TopicLessons tl ON t.topic_id = tl.topic_id WHERE t.topic_name LIKE :keyword OR t.description LIKE :keyword GROUP BY t.topic_id ORDER BY t.display_order";
                $stmt = $this->db->prepare($sql);
                $stmt->bindParam(':keyword', $search_term);
                $stmt->execute();
                $topics = $stmt->fetchAll(PDO::FETCH_ASSOC);
                return ['status' => 200, 'data' => $topics];
            } catch (Exception $e) {
                return ['status' => 500, 'message' => 'Lỗi tìm kiếm: ' . $e->getMessage()];
            }
        }

        public function searchLessons($keyword) {
            try {
                $search_term = '%' . $keyword . '%';
                $sql = "SELECT l.lesson_id, l.title, l.display_order, l.is_active, MAX(tl.topic_id) as topic_id, MAX(t.topic_name) as topic_name, COUNT(lv.vocab_id) as vocab_count FROM Lessons l LEFT JOIN TopicLessons tl ON l.lesson_id = tl.lesson_id LEFT JOIN Topics t ON tl.topic_id = t.topic_id LEFT JOIN LessonVocabulary lv ON l.lesson_id = lv.lesson_id WHERE l.title LIKE :keyword GROUP BY l.lesson_id ORDER BY l.display_order";
                $stmt = $this->db->prepare($sql);
                $stmt->bindParam(':keyword', $search_term);
                $stmt->execute();
                $lessons = $stmt->fetchAll(PDO::FETCH_ASSOC);
                return ['status' => 200, 'data' => $lessons];
            } catch (Exception $e) {
                return ['status' => 500, 'message' => 'Lỗi tìm kiếm: ' . $e->getMessage()];
            }
        }

        public function uploadAudioFile($audioData, $filename = null) {
            try {
                if (empty($audioData)) {
                    return ['status' => 400, 'message' => 'Dữ liệu audio không được để trống'];
                }
                
                if (!$filename) {
                    $filename = 'audio_' . time() . '_' . uniqid() . '.webm';
                }
                
                // FIX: Use public accessible path
                $uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/uploads/audio/';
                $publicUploadDir = 'uploads/audio/';
                
                // Create directory if it doesn't exist
                if (!is_dir($uploadDir)) {
                    if (!mkdir($uploadDir, 0755, true)) {
                        return ['status' => 500, 'message' => 'Không thể tạo thư mục upload'];
                    }
                }
                
                // Clean base64 data
                if (strpos($audioData, 'data:') === 0) {
                    $audioData = substr($audioData, strpos($audioData, ',') + 1);
                }
                
                $audioBytes = base64_decode($audioData);
                if ($audioBytes === false) {
                    return ['status' => 400, 'message' => 'Dữ liệu audio không hợp lệ'];
                }
                
                $filePath = $uploadDir . $filename;
                if (file_put_contents($filePath, $audioBytes)) {
                    $fileSize = filesize($filePath);
                    if ($fileSize === 0) {
                        unlink($filePath);
                        return ['status' => 500, 'message' => 'File audio rỗng'];
                    }
                    
                    // FIX: Return public accessible URL
                    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
                    $host = $_SERVER['HTTP_HOST'];
                    $publicUrl = $protocol . '://' . $host . '/' . $publicUploadDir . $filename;
                    
                    return [
                        'status' => 200, 
                        'message' => 'Upload audio thành công', 
                        'data' => [
                            'audio_url' => $publicUrl,
                            'file_size' => $fileSize,
                            'local_path' => $publicUploadDir . $filename
                        ]
                    ];
                }
                return ['status' => 500, 'message' => 'Không thể lưu file audio'];
            } catch (Exception $e) {
                return ['status' => 500, 'message' => 'Lỗi upload: ' . $e->getMessage()];
            }
        }

        private function getNextTopicOrder() {
            $sql = "SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM Topics";
            $stmt = $this->db->prepare($sql);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC)['next_order'] ?? 1;
        }

        private function getNextLessonOrder() {
            $sql = "SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM Lessons";
            $stmt = $this->db->prepare($sql);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC)['next_order'] ?? 1;
        }

        private function getNextVocabOrder($lesson_id) {
            $sql = "SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM LessonVocabulary WHERE lesson_id = :lesson_id";
            $stmt = $this->db->prepare($sql);
            $lesson_id_int = intval($lesson_id);
            $stmt->bindParam(':lesson_id', $lesson_id_int, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC)['next_order'] ?? 1;
        }
    }
    ?>