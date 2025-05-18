<?php

require_once __DIR__ . '/../models/Lesson.php';
require_once __DIR__ . '/../models/LessonVocabulary.php';

class LessonController {
    private $db;
    private $lesson;
    private $lessonVocabulary;

    // Hàm khởi tạo
    public function __construct($db) {
        $this->db = $db;
        $this->lesson = new Lesson($db);
        $this->lessonVocabulary = new LessonVocabulary($db);
    }

    // Lấy tất cả bài học
    public function getAllLessons() {
        $result = $this->lesson->getAll();
        if ($result) {
            return ['status' => 'success', 'data' => $result];
        } else {
            return ['status' => 'error', 'message' => 'Không tìm thấy bài học'];
        }
    }

    // Lấy bài học theo ID
    public function getLesson($id) {
        try {
            $lesson = $this->lesson->getById($id);
            if (!$lesson) {
                return ['status' => 'error', 'message' => 'Không tìm thấy bài học'];
            }
            
            // Lấy từ vựng của bài học
            $vocabulary = $this->lessonVocabulary->getByLessonId($id);
            
            return [
                'status' => 'success',
                'data' => [
                    'lesson' => $lesson,
                    'vocabulary' => $vocabulary
                ]
            ];
        } catch (Exception $e) {
            error_log('Error in getLesson: ' . $e->getMessage());
            return ['status' => 'error', 'message' => 'Không thể tải thông tin bài học'];
        }
    }

        // Lấy bài học theo chủ đề và thông tin tiến độ của user
    // getLessonsByTopic trong LessonController.php
    public function getLessonsByTopic($topic_id, $user_id = null) {
        try {
            $sql = "SELECT l.*, tl.topic_id FROM Lessons l
                    JOIN TopicLessons tl ON l.lesson_id = tl.lesson_id
                    WHERE tl.topic_id = :topic_id AND l.is_active = 1
                    ORDER BY l.display_order";
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(":topic_id", $topic_id, PDO::PARAM_INT);
            $stmt->execute();
            $lessons = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($lessons)) {
                return ['status' => 'success', 'data' => []];
            }
            
            // Nếu có user_id, lấy thêm thông tin tiến độ học
            if ($user_id) {
                foreach ($lessons as &$lesson) {
                    // Đếm tổng số từ trong bài học
                    $sql = "SELECT COUNT(*) as total FROM LessonVocabulary WHERE lesson_id = :lesson_id";
                    $stmt = $this->db->prepare($sql);
                    $stmt->bindParam(":lesson_id", $lesson['lesson_id'], PDO::PARAM_INT);
                    $stmt->execute();
                    $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
                    
                    // Đếm số từ user đã học và thuộc
                    $sql = "SELECT 
                            COUNT(DISTINCT lv.vocab_id) as total_learned,
                            SUM(CASE WHEN p.is_memorized = 1 THEN 1 ELSE 0 END) as total_memorized
                            FROM LessonVocabulary lv
                            LEFT JOIN Progress p ON lv.vocab_id = p.vocab_id AND p.user_id = :user_id
                            WHERE lv.lesson_id = :lesson_id";
                    $stmt = $this->db->prepare($sql);
                    $stmt->bindParam(":user_id", $user_id, PDO::PARAM_INT);
                    $stmt->bindParam(":lesson_id", $lesson['lesson_id'], PDO::PARAM_INT);
                    $stmt->execute();
                    $progress = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    // Tính phần trăm hoàn thành
                    $completed_percentage = ($total > 0) ? 
                        round(($progress['total_memorized'] / $total) * 100, 1) : 0;
                    
                    // Thêm thông tin tiến độ vào kết quả
                    $lesson['total_words'] = (int)$total;
                    $lesson['total_learned'] = (int)$progress['total_learned'];
                    $lesson['total_memorized'] = (int)$progress['total_memorized'];
                    $lesson['completed_percentage'] = $completed_percentage;
                    $lesson['is_completed'] = ($completed_percentage >= 90) ? 1 : 0;
                }
            }
            
            return ['status' => 'success', 'data' => $lessons];
        } catch (Exception $e) {
            // Log lỗi để debug
            error_log('Error in getLessonsByTopic: ' . $e->getMessage());
            return ['status' => 'error', 'message' => 'Không thể tải bài học của chủ đề'];
        }
    }

    // Lấy từ vựng của bài học với tiến độ học của user
    // Sửa lại phương thức getLessonVocabularyWithProgress trong LessonController.php
    public function getLessonVocabularyWithProgress($lesson_id, $user_id) {
        try {
            $sql = "SELECT lv.*, v.word, v.meaning, v.pronunciation, v.example, v.audio, v.word_type, 
                    p.is_memorized, p.review_count, p.last_review_date
                    FROM LessonVocabulary lv
                    JOIN Vocabulary v ON lv.vocab_id = v.vocab_id
                    LEFT JOIN Progress p ON v.vocab_id = p.vocab_id AND p.user_id = :user_id
                    WHERE lv.lesson_id = :lesson_id
                    ORDER BY lv.display_order";
            
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->bindParam(':lesson_id', $lesson_id, PDO::PARAM_INT);
            $stmt->execute();
            
            $vocabulary = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            return ['status' => 'success', 'data' => $vocabulary];
        } catch (Exception $e) {
            error_log('Error in getLessonVocabularyWithProgress: ' . $e->getMessage());
            return ['status' => 'error', 'message' => 'Không thể tải từ vựng của bài học'];
        }
    }
}