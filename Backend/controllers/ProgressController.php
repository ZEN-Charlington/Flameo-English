<?php
// controllers/ProgressController.php

require_once __DIR__ . '/../models/Progress.php';
require_once __DIR__ . '/../models/Vocabulary.php';
require_once __DIR__ . '/../models/Lesson.php';
require_once __DIR__ . '/../models/Topic.php';

class ProgressController {
    private $db;
    private $progress;
    private $vocabulary;
    private $lesson;
    private $topic;

    public function __construct($db) {
        $this->db = $db;
        $this->progress = new Progress($db);
        $this->vocabulary = new Vocabulary($db);
        $this->lesson = new Lesson($db);
        $this->topic = new Topic($db);
    }

    // === QUẢN LÝ TIẾN ĐỘ TỪ VỰNG ===

    // Cập nhật tiến độ học của từ vựng
    public function updateVocabProgress($user_id, $vocab_id, $is_memorized) {
        // Kiểm tra từ vựng có tồn tại không
        $vocab = $this->vocabulary->getById($vocab_id);
        if (!$vocab) {
            return [
                'status' => 404,
                'message' => 'Từ vựng không tồn tại'
            ];
        }
        
        try {
            $is_memorized = (int)$is_memorized;
            // Kiểm tra tiến độ đã tồn tại chưa
            $existing = $this->progress->getProgressByUserAndVocab($user_id, $vocab_id);
            
            if ($existing) {
                // Cập nhật tiến độ
                $result = $this->progress->updateVocabProgress($user_id, $vocab_id, $is_memorized);
            } else {
                // Tạo mới và cập nhật
                $this->progress->createVocabProgress($user_id, $vocab_id);
                $result = $this->progress->updateVocabProgress($user_id, $vocab_id, $is_memorized);
            }
            
            if ($result) {
                // Tìm lesson_id của vocab này để cập nhật tiến độ lesson nếu cần
                $stmt = $this->db->prepare("
                    SELECT lesson_id FROM LessonVocabulary 
                    WHERE vocab_id = :vocab_id 
                    LIMIT 1
                ");
                $stmt->bindParam(':vocab_id', $vocab_id);
                $stmt->execute();
                $lesson_data = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($lesson_data) {
                    $lesson_id = $lesson_data['lesson_id'];
                    
                    // Tính toán lại phần trăm hoàn thành của bài học
                    $completion_percentage = $this->progress->calculateLessonCompletion($user_id, $lesson_id);
                    
                    // Nếu hoàn thành trên 95%, đánh dấu bài học là đã hoàn thành
                    if ($completion_percentage >= 95) {
                        $this->completeLessonProgress($user_id, $lesson_id);
                    }
                }
                
                return [
                    'status' => 200,
                    'message' => 'Cập nhật tiến độ học thành công'
                ];
            } else {
                return [
                    'status' => 500,
                    'message' => 'Không thể cập nhật tiến độ học'
                ];
            }
        } catch (Exception $e) {
            return [
                'status' => 500,
                'message' => 'Lỗi khi cập nhật tiến độ học: ' . $e->getMessage()
            ];
        }
    }

    // Lấy tiến độ học từ vựng của user
    public function getUserVocabProgress($user_id) {
        $result = $this->progress->getUserVocabProgress($user_id);
        
        if($result) {
            return [
                'status' => 200,
                'data' => $result
            ];
        } else {
            return [
                'status' => 200,
                'data' => [],
                'message' => 'Chưa có dữ liệu tiến độ học'
            ];
        }
    }

    // Lấy thống kê tiến độ học từ vựng
    public function getVocabProgressStats($user_id) {
        $stats = $this->progress->getVocabProgressStats($user_id);
        
        // Lấy tổng số từ vựng trong database
        $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM Vocabulary");
        $stmt->execute();
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        $data = [
            'total_learned' => (int)($stats['total_learned'] ?? 0),
            'total_memorized' => (int)($stats['total_memorized'] ?? 0),
            'total_words' => (int)$total,
            'percentage' => 0
        ];
        
        // Tính phần trăm hoàn thành
        if ($total > 0) {
            $data['percentage'] = round(($data['total_memorized'] / $total) * 100, 1);
        }
        
        return [
            'status' => 200,
            'data' => $data
        ];
    }

    // Hoàn thành bài học
    public function completeLessonProgress($user_id, $lesson_id) {
        try {
            // Kiểm tra bài học có tồn tại không
            $lesson = $this->lesson->getById($lesson_id);
            if (!$lesson) {
                return [
                    'status' => 404,
                    'message' => 'Bài học không tồn tại'
                ];
            }
            
            // Kiểm tra tiến độ bài học đã tồn tại chưa
            $existing = $this->progress->getLessonProgress($user_id, $lesson_id);
            
            if ($existing) {
                // Cập nhật tiến độ
                $result = $this->progress->completeLessonProgress($user_id, $lesson_id);
            } else {
                // Tạo mới và cập nhật
                $this->progress->createLessonProgress($user_id, $lesson_id);
                $result = $this->progress->completeLessonProgress($user_id, $lesson_id);
            }
            
            if ($result) {
                // Tìm topic_id của lesson này để cập nhật tiến độ topic
                $stmt = $this->db->prepare("
                    SELECT topic_id FROM TopicLessons 
                    WHERE lesson_id = :lesson_id 
                    LIMIT 1
                ");
                $stmt->bindParam(':lesson_id', $lesson_id);
                $stmt->execute();
                $topic_data = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($topic_data) {
                    $topic_id = $topic_data['topic_id'];
                    
                    // Cập nhật tiến độ chủ đề
                    $this->progress->updateTopicProgress($user_id, $topic_id);
                }
                
                return [
                    'status' => 200,
                    'message' => 'Bài học đã được đánh dấu hoàn thành'
                ];
            } else {
                return [
                    'status' => 500,
                    'message' => 'Không thể cập nhật tiến độ bài học'
                ];
            }
        } catch (Exception $e) {
            return [
                'status' => 500,
                'message' => 'Lỗi khi cập nhật tiến độ bài học: ' . $e->getMessage()
            ];
        }
    }
    
    // Lấy danh sách bài học đã hoàn thành
    public function getUserCompletedLessons($user_id) {
        $lessons = $this->progress->getUserCompletedLessons($user_id);
        
        return [
            'status' => 200,
            'data' => $lessons
        ];
    }
    
    // Tính toán tiến độ của bài học
    public function calculateLessonProgress($user_id, $lesson_id) {
        try {
            $completion_percentage = $this->progress->calculateLessonCompletion($user_id, $lesson_id);
            
            // Kiểm tra xem bài học đã đạt 95% chưa để đánh dấu hoàn thành
            $is_completed = ($completion_percentage >= 95) ? true : false;
            
            return [
                'status' => 200,
                'data' => [
                    'completion_percentage' => $completion_percentage,
                    'is_completed' => $is_completed
                ]
            ];
        } catch (Exception $e) {
            return [
                'status' => 500,
                'message' => 'Lỗi khi tính toán tiến độ bài học: ' . $e->getMessage()
            ];
        }
    }

    // === QUẢN LÝ TIẾN ĐỘ CHỦ ĐỀ ===
    
    // Cập nhật tiến độ chủ đề
    public function updateTopicProgress($user_id, $topic_id) {
        try {
            // Kiểm tra chủ đề có tồn tại không
            $topic = $this->topic->getById($topic_id);
            if (!$topic) {
                return [
                    'status' => 404,
                    'message' => 'Chủ đề không tồn tại'
                ];
            }
            
            // Cập nhật tiến độ chủ đề
            $result = $this->progress->updateTopicProgress($user_id, $topic_id);
            
            if ($result) {
                return [
                    'status' => 200,
                    'message' => 'Cập nhật tiến độ chủ đề thành công'
                ];
            } else {
                return [
                    'status' => 500,
                    'message' => 'Không thể cập nhật tiến độ chủ đề'
                ];
            }
        } catch (Exception $e) {
            return [
                'status' => 500,
                'message' => 'Lỗi khi cập nhật tiến độ chủ đề: ' . $e->getMessage()
            ];
        }
    }
    
    // Lấy tiến độ của tất cả chủ đề
    public function getUserTopicsProgress($user_id) {
        $topics = $this->progress->getUserTopicsProgress($user_id);
        
        return [
            'status' => 200,
            'data' => $topics
        ];
    }
    
    // === QUẢN LÝ TIẾN ĐỘ TỔNG QUAN ===
    
    // Lấy thống kê tiến độ học tập tổng quan
    public function getOverallProgress($user_id) {
        try {
            // Lấy thống kê từ vựng
            $vocab_stats = $this->progress->getVocabProgressStats($user_id);
            
            // Lấy số bài học đã hoàn thành
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as completed_lessons
                FROM LessonProgress
                WHERE user_id = :user_id AND is_completed = 1
            ");
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();
            $completed_lessons = $stmt->fetch(PDO::FETCH_ASSOC)['completed_lessons'];
            
            // Lấy tổng số bài học
            $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM Lessons WHERE is_active = 1");
            $stmt->execute();
            $total_lessons = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Lấy tổng số chủ đề
            $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM Topics WHERE is_active = 1");
            $stmt->execute();
            $total_topics = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Lấy số chủ đề đã hoàn thành (>= 95%)
            $stmt = $this->db->prepare("
                SELECT COUNT(*) as completed_topics
                FROM TopicProgress
                WHERE user_id = :user_id AND completed_percentage >= 95
            ");
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();
            $completed_topics = $stmt->fetch(PDO::FETCH_ASSOC)['completed_topics'];
            
            // Tính toán tiến độ tổng quan
            $total_vocab = $this->db->query("SELECT COUNT(*) as total FROM Vocabulary")->fetch(PDO::FETCH_ASSOC)['total'];
            $vocab_percentage = ($total_vocab > 0) ? 
                round((($vocab_stats['total_memorized'] ?? 0) / $total_vocab) * 100, 1) : 0;
                
            $lesson_percentage = ($total_lessons > 0) ? 
                round(($completed_lessons / $total_lessons) * 100, 1) : 0;
                
            $topic_percentage = ($total_topics > 0) ? 
                round(($completed_topics / $total_topics) * 100, 1) : 0;
                
            // Tính tiến độ tổng thể (trung bình)
            $overall_percentage = round(($vocab_percentage + $lesson_percentage + $topic_percentage) / 3, 1);
            
            return [
                'status' => 200,
                'data' => [
                    'vocabulary' => [
                        'total_learned' => (int)($vocab_stats['total_learned'] ?? 0),
                        'total_memorized' => (int)($vocab_stats['total_memorized'] ?? 0),
                        'total' => (int)$total_vocab,
                        'percentage' => $vocab_percentage
                    ],
                    'lessons' => [
                        'completed' => (int)$completed_lessons,
                        'total' => (int)$total_lessons,
                        'percentage' => $lesson_percentage
                    ],
                    'topics' => [
                        'completed' => (int)$completed_topics,
                        'total' => (int)$total_topics,
                        'percentage' => $topic_percentage
                    ],
                    'overall_percentage' => $overall_percentage
                ]
            ];
        } catch (Exception $e) {
            return [
                'status' => 500,
                'message' => 'Lỗi khi lấy tiến độ tổng quan: ' . $e->getMessage()
            ];
        }
    }
    
    // Tạo bảng trong cơ sở dữ liệu nếu chưa có
    public function createTablesIfNotExist() {
        try {
            // Tạo bảng Progress (từ vựng) nếu chưa có
            $query = "CREATE TABLE IF NOT EXISTS Progress (
                progress_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                vocab_id INT NOT NULL,
                is_memorized TINYINT(1) DEFAULT 0,
                review_count INT DEFAULT 0,
                last_review_date DATETIME,
                UNIQUE KEY (user_id, vocab_id)
            )";
            $this->db->exec($query);
            
            // Tạo bảng LessonProgress nếu chưa có
            $query = "CREATE TABLE IF NOT EXISTS LessonProgress (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                lesson_id INT NOT NULL,
                is_completed TINYINT(1) DEFAULT 0,
                completion_date DATETIME,
                UNIQUE KEY (user_id, lesson_id)
            )";
            $this->db->exec($query);
            
            // Tạo bảng TopicProgress nếu chưa có
            $query = "CREATE TABLE IF NOT EXISTS TopicProgress (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                topic_id INT NOT NULL,
                completed_lessons INT DEFAULT 0,
                total_lessons INT DEFAULT 0,
                completed_percentage FLOAT DEFAULT 0,
                UNIQUE KEY (user_id, topic_id)
            )";
            $this->db->exec($query);
            
            return [
                'status' => 200,
                'message' => 'Tạo bảng tiến độ thành công (nếu chưa có)'
            ];
        } catch (Exception $e) {
            return [
                'status' => 500,
                'message' => 'Lỗi khi tạo bảng tiến độ: ' . $e->getMessage()
            ];
        }
    }
    
    // API endpoint để hoàn thành bài học (gọi từ frontend)
    public function handleCompleteLessonRequest($user_id, $lesson_id) {
        try {
            // 1. Đánh dấu bài học là đã hoàn thành
            $result = $this->completeLessonProgress($user_id, $lesson_id);
            
            if ($result['status'] !== 200) {
                return $result;
            }
            
            // 2. Lấy thông tin bài học đã cập nhật
            $stmt = $this->db->prepare("
                SELECT l.*, lp.is_completed, lp.completion_date
                FROM Lessons l
                LEFT JOIN LessonProgress lp ON l.lesson_id = lp.lesson_id AND lp.user_id = :user_id
                WHERE l.lesson_id = :lesson_id
            ");
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindParam(':lesson_id', $lesson_id);
            $stmt->execute();
            $updated_lesson = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // 3. Kiểm tra và trả về thông tin bài học tiếp theo (nếu có)
            $stmt = $this->db->prepare("
                SELECT l.lesson_id, l.title
                FROM TopicLessons tl
                JOIN Lessons l ON tl.lesson_id = l.lesson_id
                WHERE tl.topic_id = (
                    SELECT topic_id 
                    FROM TopicLessons 
                    WHERE lesson_id = :lesson_id
                )
                AND tl.lesson_id > :lesson_id
                ORDER BY tl.lesson_id ASC
                LIMIT 1
            ");
            $stmt->bindParam(':lesson_id', $lesson_id);
            $stmt->execute();
            $next_lesson = $stmt->fetch(PDO::FETCH_ASSOC);
            
            return [
                'status' => 200,
                'message' => 'Bài học đã được đánh dấu hoàn thành',
                'data' => [
                    'lesson' => $updated_lesson,
                    'next_lesson' => $next_lesson ?: null
                ]
            ];
        } catch (Exception $e) {
            error_log('Error in handleCompleteLessonRequest: ' . $e->getMessage());
            return [
                'status' => 500,
                'message' => 'Lỗi khi hoàn thành bài học: ' . $e->getMessage()
            ];
        }
    }
    public function getUserVocabWithDetails($user_id) {
        try {
            // Lấy danh sách từ vựng của user với thông tin chi tiết
            $query = "
                SELECT v.*, p.is_memorized, p.review_count, p.last_review_date
                FROM Vocabulary v
                JOIN Progress p ON v.vocab_id = p.vocab_id
                WHERE p.user_id = :user_id
                ORDER BY p.last_review_date DESC
            ";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();
            $vocabularies = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if ($vocabularies) {
                return [
                    'status' => 200,
                    'data' => $vocabularies
                ];
            } else {
                return [
                    'status' => 200,
                    'data' => [],
                    'message' => 'Bạn chưa học từ vựng nào'
                ];
            }
        } catch (Exception $e) {
            return [
                'status' => 500,
                'message' => 'Lỗi khi lấy dữ liệu từ vựng: ' . $e->getMessage()
            ];
        }
    }
    
    // Khôi phục tiến độ của user (xóa hết tiến độ)
    public function resetUserProgress($user_id) {
        try {
            // Xóa tiến độ từ vựng
            $stmt = $this->db->prepare("DELETE FROM Progress WHERE user_id = :user_id");
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();
            
            // Xóa tiến độ bài học
            $stmt = $this->db->prepare("DELETE FROM LessonProgress WHERE user_id = :user_id");
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();
            
            // Xóa tiến độ chủ đề
            $stmt = $this->db->prepare("DELETE FROM TopicProgress WHERE user_id = :user_id");
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();
            
            return [
                'status' => 200,
                'message' => 'Đã khôi phục tiến độ học tập'
            ];
        } catch (Exception $e) {
            return [
                'status' => 500,
                'message' => 'Lỗi khi khôi phục tiến độ: ' . $e->getMessage()
            ];
        }
    }
    
    // Kiểm tra và cập nhật trạng thái hoàn thành bài học dựa trên số từ đã thuộc
    public function checkAndUpdateLessonCompletion($user_id, $lesson_id) {
        try {
            // Tính toán phần trăm hoàn thành
            $completion_percentage = $this->progress->calculateLessonCompletion($user_id, $lesson_id);
            
            // Nếu đã học >= 95% từ vựng, đánh dấu bài học là đã hoàn thành
            if ($completion_percentage >= 95) {
                return $this->completeLessonProgress($user_id, $lesson_id);
            }
            
            return [
                'status' => 200,
                'data' => [
                    'completion_percentage' => $completion_percentage,
                    'is_completed' => false
                ]
            ];
        } catch (Exception $e) {
            return [
                'status' => 500,
                'message' => 'Lỗi khi kiểm tra tiến độ bài học: ' . $e->getMessage()
            ];
        }
    }
    public function getWordsToReview($user_id, $limit = 100) {
        try {
            // Lấy ngày hôm nay và hôm qua
            $today = date('Y-m-d');
            $yesterday = date('Y-m-d', strtotime('-1 day'));
            
            // Truy vấn lấy các từ vựng đã học hôm nay và hôm qua
            // Thêm điều kiện review_count < 2 để chỉ lấy từ chưa ôn tập đủ 2 lần
            $query = "
                SELECT v.*, p.is_memorized, p.review_count, p.last_review_date
                FROM Vocabulary v
                JOIN Progress p ON v.vocab_id = p.vocab_id
                WHERE p.user_id = :user_id 
                AND (DATE(p.last_review_date) = :today OR DATE(p.last_review_date) = :yesterday)
                AND p.review_count < 2 
                ORDER BY p.last_review_date DESC
                LIMIT :limit
            ";
            
            // Sử dụng $this->db thay vì $this->conn
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->bindParam(':today', $today);
            $stmt->bindParam(':yesterday', $yesterday);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            $words = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if ($words && count($words) > 0) {
                return [
                    'status' => 200,
                    'data' => $words
                ];
            } else {
                // Nếu không có từ nào cần ôn tập
                return [
                    'status' => 200,
                    'data' => [],
                    'message' => 'Không có từ nào cần ôn tập. Bạn đã ôn tập đủ hoặc chưa học từ mới nào.'
                ];
            }
        } catch (Exception $e) {
            return [
                'status' => 500,
                'message' => 'Lỗi khi lấy từ vựng cần ôn tập: ' . $e->getMessage()
            ];
        }
    }

    public function getTodayAndYesterdayVocabulary($user_id) {
        try {
            // Lấy ngày hôm nay và hôm qua
            $today = date('Y-m-d');
            $yesterday = date('Y-m-d', strtotime('-1 day'));
            
            // Truy vấn lấy tất cả các từ vựng đã học trong 2 ngày qua
            // Không lọc theo review_count để lấy tất cả từ vựng trong 2 ngày gần đây
            $query = "
                SELECT v.*, p.is_memorized, p.review_count, p.last_review_date
                FROM Vocabulary v
                JOIN Progress p ON v.vocab_id = p.vocab_id
                WHERE p.user_id = :user_id 
                AND (DATE(p.last_review_date) = :today OR DATE(p.last_review_date) = :yesterday)
                ORDER BY p.last_review_date DESC
            ";
            
            // Sử dụng $this->db thay vì $this->conn
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->bindParam(':today', $today);
            $stmt->bindParam(':yesterday', $yesterday);
            $stmt->execute();
            $vocabularies = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if ($vocabularies && count($vocabularies) > 0) {
                return [
                    'status' => 200,
                    'data' => $vocabularies
                ];
            } else {
                return [
                    'status' => 200,
                    'data' => [],
                    'message' => 'Không có từ vựng nào trong 2 ngày qua'
                ];
            }
        } catch (Exception $e) {
            return [
                'status' => 500,
                'message' => 'Lỗi khi lấy dữ liệu từ vựng: ' . $e->getMessage()
            ];
        }
    }

    // Thêm API endpoint để lấy các từ có cùng loại từ 
    public function getSimilarWords($word_type = 'noun', $vocab_id = 0, $limit = 10) {
        try {
            // Tạo câu truy vấn để lấy các từ cùng loại trừ từ hiện tại
            $query = "
                SELECT v.vocab_id, v.word, v.meaning, v.word_type
                FROM Vocabulary v
                WHERE v.word_type = :word_type
                AND v.vocab_id != :vocab_id
                ORDER BY RAND()
                LIMIT :limit
            ";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':word_type', $word_type, PDO::PARAM_STR);
            $stmt->bindParam(':vocab_id', $vocab_id, PDO::PARAM_INT);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            $similarWords = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if ($similarWords && count($similarWords) > 0) {
                return [
                    'status' => 200,
                    'data' => $similarWords
                ];
            } else {
                // Nếu không có từ nào cùng loại, thử lấy các từ ngẫu nhiên
                $fallbackQuery = "
                    SELECT v.vocab_id, v.word, v.meaning, v.word_type
                    FROM Vocabulary v
                    WHERE v.vocab_id != :vocab_id
                    ORDER BY RAND()
                    LIMIT :limit
                ";
                
                $stmt = $this->db->prepare($fallbackQuery);
                $stmt->bindParam(':vocab_id', $vocab_id, PDO::PARAM_INT);
                $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
                $stmt->execute();
                $randomWords = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                if ($randomWords && count($randomWords) > 0) {
                    return [
                        'status' => 200,
                        'data' => $randomWords
                    ];
                } else {
                    return [
                        'status' => 200,
                        'data' => [],
                        'message' => 'Không tìm thấy từ vựng phù hợp'
                    ];
                }
            }
        } catch (Exception $e) {
            return [
                'status' => 500,
                'message' => 'Lỗi khi lấy từ vựng tương tự: ' . $e->getMessage()
            ];
        }
    }
    public function getMemorizedVocabulary($user_id) {
        try {
            $query = "
                SELECT v.*, p.is_memorized, p.review_count, p.last_review_date
                FROM Vocabulary v
                JOIN Progress p ON v.vocab_id = p.vocab_id
                WHERE p.user_id = :user_id AND p.is_memorized = 1
                ORDER BY p.last_review_date DESC
            ";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->execute();
            $vocabularies = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if ($vocabularies && count($vocabularies) > 0) {
                return [
                    'status' => 200,
                    'data' => $vocabularies,
                    'message' => 'Đã tải ' . count($vocabularies) . ' từ đã thuộc'
                ];
            } else {
                return [
                    'status' => 200,
                    'data' => [],
                    'message' => 'Bạn chưa có từ nào đã thuộc trong sổ tay'
                ];
            }
        } catch (Exception $e) {
            return [
                'status' => 500,
                'message' => 'Lỗi khi lấy từ vựng đã thuộc: ' . $e->getMessage()
            ];
        }
    }

    // Lấy từ vựng chưa thuộc trong sổ tay
    public function getNotMemorizedVocabulary($user_id) {
        try {
            $query = "
                SELECT v.*, p.is_memorized, p.review_count, p.last_review_date
                FROM Vocabulary v
                JOIN Progress p ON v.vocab_id = p.vocab_id
                WHERE p.user_id = :user_id AND p.is_memorized = 0
                ORDER BY p.last_review_date DESC
            ";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->execute();
            $vocabularies = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if ($vocabularies && count($vocabularies) > 0) {
                return [
                    'status' => 200,
                    'data' => $vocabularies,
                    'message' => 'Đã tải ' . count($vocabularies) . ' từ chưa thuộc'
                ];
            } else {
                return [
                    'status' => 200,
                    'data' => [],
                    'message' => 'Bạn chưa có từ nào chưa thuộc trong sổ tay'
                ];
            }
        } catch (Exception $e) {
            return [
                'status' => 500,
                'message' => 'Lỗi khi lấy từ vựng chưa thuộc: ' . $e->getMessage()
            ];
        }
    }

    // Lấy tất cả từ vựng trong sổ tay (đã học)
    public function getAllNotebookVocabulary($user_id) {
        try {
            $query = "
                SELECT v.*, p.is_memorized, p.review_count, p.last_review_date
                FROM Vocabulary v
                JOIN Progress p ON v.vocab_id = p.vocab_id
                WHERE p.user_id = :user_id
                ORDER BY p.is_memorized DESC, p.last_review_date DESC
            ";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->execute();
            $vocabularies = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if ($vocabularies && count($vocabularies) > 0) {
                // Phân loại từ
                $memorized = array_filter($vocabularies, function($vocab) {
                    return $vocab['is_memorized'] == 1;
                });
                $notMemorized = array_filter($vocabularies, function($vocab) {
                    return $vocab['is_memorized'] == 0;
                });
                
                return [
                    'status' => 200,
                    'data' => [
                        'all' => $vocabularies,
                        'memorized' => array_values($memorized),
                        'not_memorized' => array_values($notMemorized),
                        'stats' => [
                            'total' => count($vocabularies),
                            'memorized_count' => count($memorized),
                            'not_memorized_count' => count($notMemorized)
                        ]
                    ],
                    'message' => 'Đã tải sổ tay từ vựng'
                ];
            } else {
                return [
                    'status' => 200,
                    'data' => [
                        'all' => [],
                        'memorized' => [],
                        'not_memorized' => [],
                        'stats' => [
                            'total' => 0,
                            'memorized_count' => 0,
                            'not_memorized_count' => 0
                        ]
                    ],
                    'message' => 'Sổ tay từ vựng của bạn đang trống'
                ];
            }
        } catch (Exception $e) {
            return [
                'status' => 500,
                'message' => 'Lỗi khi lấy sổ tay từ vựng: ' . $e->getMessage()
            ];
        }
    }

    // Lấy thống kê số từ học theo ngày
    public function getLearningStats($user_id) {
        try {
            // Lấy 7 ngày gần nhất
            $query = "
                SELECT 
                    DATE(last_review_date) as date,
                    COUNT(DISTINCT vocab_id) as count,
                    SUM(CASE WHEN is_memorized = 1 THEN 1 ELSE 0 END) as learned
                FROM Progress
                WHERE user_id = :user_id
                AND last_review_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                GROUP BY DATE(last_review_date)
                ORDER BY date ASC
            ";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->execute();
            $stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Format lại dữ liệu cho dễ hiểu
            $formattedStats = [];
            foreach ($stats as $day) {
                // Format ngày thành d/m
                $date = new DateTime($day['date']);
                
                $formattedStats[] = [
                    'date' => $date->format('d/m'),
                    'count' => (int)$day['count'],
                    'learned' => (int)$day['learned']
                ];
            }
            
            return [
                'status' => 200,
                'data' => $formattedStats
            ];
        } catch (Exception $e) {
            return [
                'status' => 500,
                'message' => 'Lỗi khi lấy thống kê học tập: ' . $e->getMessage()
            ];
        }
    }
}
?>