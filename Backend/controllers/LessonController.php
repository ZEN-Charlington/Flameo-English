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
    }

    // Lấy bài học theo chủ đề và thông tin tiến độ của user
    public function getLessonsByTopic($topic_id, $user_id = null) {
        $sql = "SELECT l.*, tl.topic_id FROM Lessons l
                JOIN TopicLessons tl ON l.lesson_id = tl.lesson_id
                WHERE tl.topic_id = ? AND l.is_active = 1
                ORDER BY l.display_order";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("i", $topic_id);
        $stmt->execute();
        $lessons = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        
        if (!$lessons) {
            return ['status' => 'error', 'message' => 'Không tìm thấy bài học trong chủ đề này'];
        }
        
        // Nếu có user_id, lấy thêm thông tin tiến độ học
        if ($user_id) {
            foreach ($lessons as &$lesson) {
                // Đếm tổng số từ trong bài học
                $sql = "SELECT COUNT(*) as total FROM LessonVocabulary WHERE lesson_id = ?";
                $stmt = $this->db->prepare($sql);
                $stmt->bind_param("i", $lesson['lesson_id']);
                $stmt->execute();
                $total = $stmt->get_result()->fetch_assoc()['total'];
                
                // Đếm số từ user đã học và thuộc
                $sql = "SELECT 
                        COUNT(DISTINCT lv.vocab_id) as total_learned,
                        SUM(CASE WHEN p.is_memorized = 1 THEN 1 ELSE 0 END) as total_memorized
                        FROM LessonVocabulary lv
                        LEFT JOIN Progress p ON lv.vocab_id = p.vocab_id AND p.user_id = ?
                        WHERE lv.lesson_id = ?";
                $stmt = $this->db->prepare($sql);
                $stmt->bind_param("ii", $user_id, $lesson['lesson_id']);
                $stmt->execute();
                $progress = $stmt->get_result()->fetch_assoc();
                
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
    }

    // Lấy từ vựng của bài học với tiến độ học của user
    public function getLessonVocabularyWithProgress($lesson_id, $user_id) {
        $sql = "SELECT lv.*, v.word, v.meaning, v.pronunciation, v.example, v.audio, v.word_type, 
                p.is_memorized, p.review_count, p.last_review_date
                FROM LessonVocabulary lv
                JOIN Vocabulary v ON lv.vocab_id = v.vocab_id
                LEFT JOIN Progress p ON v.vocab_id = p.vocab_id AND p.user_id = ?
                WHERE lv.lesson_id = ?
                ORDER BY lv.display_order";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("ii", $user_id, $lesson_id);
        $stmt->execute();
        $vocabulary = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        
        return ['status' => 'success', 'data' => $vocabulary];
    }
}