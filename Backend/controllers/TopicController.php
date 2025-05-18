<?php
// controllers/TopicController.php

require_once __DIR__ . '/../models/Topic.php';

class TopicController {
    private $db;
    private $topic;

    // Hàm khởi tạo
    public function __construct($db) {
        $this->db = $db;
        $this->topic = new Topic($db);
    }

    // Lấy tất cả chủ đề
    public function getAllTopics() {
        $result = $this->topic->getAllActive();
        if ($result) {
            // Thêm thông tin cơ bản về lesson_count và total_words cho mỗi chủ đề
            foreach ($result as &$topic) {
                // Lấy thông tin số bài học
                $sql = "SELECT COUNT(*) as lesson_count FROM TopicLessons tl 
                        JOIN Lessons l ON tl.lesson_id = l.lesson_id 
                        WHERE tl.topic_id = :topic_id AND l.is_active = 1";
                $stmt = $this->db->prepare($sql);
                $stmt->bindParam(':topic_id', $topic['topic_id'], PDO::PARAM_INT);
                $stmt->execute();
                $topic['lesson_count'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['lesson_count'];
                
                // Đếm tổng số từ trong chủ đề
                $sql = "SELECT COUNT(DISTINCT lv.vocab_id) as total
                        FROM TopicLessons tl
                        JOIN LessonVocabulary lv ON tl.lesson_id = lv.lesson_id
                        WHERE tl.topic_id = :topic_id";
                $stmt = $this->db->prepare($sql);
                $stmt->bindParam(':topic_id', $topic['topic_id'], PDO::PARAM_INT);
                $stmt->execute();
                $topic['total_words'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];
                
                // Khởi tạo giá trị mặc định cho tiến độ
                $topic['total_learned'] = 0;
                $topic['total_memorized'] = 0;
                $topic['completed_percentage'] = 0;
            }
            
            return ['status' => 'success', 'data' => $result];
        } else {
            return ['status' => 'error', 'message' => 'Không tìm thấy chủ đề'];
        }
    }

    // Lấy chủ đề theo ID
    public function getTopic($id) {
        $result = $this->topic->getById($id);
        if ($result) {
            // Lấy thông tin số bài học
            $sql = "SELECT COUNT(*) as lesson_count FROM TopicLessons tl 
                    JOIN Lessons l ON tl.lesson_id = l.lesson_id 
                    WHERE tl.topic_id = :topic_id AND l.is_active = 1";
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':topic_id', $id, PDO::PARAM_INT);
            $stmt->execute();
            $result['lesson_count'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['lesson_count'];
            
            // Đếm tổng số từ trong chủ đề
            $sql = "SELECT COUNT(DISTINCT lv.vocab_id) as total
                    FROM TopicLessons tl
                    JOIN LessonVocabulary lv ON tl.lesson_id = lv.lesson_id
                    WHERE tl.topic_id = :topic_id";
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':topic_id', $id, PDO::PARAM_INT);
            $stmt->execute();
            $result['total_words'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            return ['status' => 'success', 'data' => $result];
        } else {
            return ['status' => 'error', 'message' => 'Không tìm thấy chủ đề'];
        }
    }

    // Lấy chủ đề theo ID với tiến độ học của user
    public function getTopicWithProgress($id, $user_id) {
        $topic = $this->topic->getById($id);
        
        if (!$topic) {
            return ['status' => 'error', 'message' => 'Không tìm thấy chủ đề'];
        }
        
        // Đếm tổng số từ trong chủ đề
        $sql = "SELECT COUNT(DISTINCT lv.vocab_id) as total
                FROM TopicLessons tl
                JOIN LessonVocabulary lv ON tl.lesson_id = lv.lesson_id
                WHERE tl.topic_id = :topic_id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':topic_id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Đếm số từ user đã học và thuộc
        $sql = "SELECT 
                COUNT(DISTINCT CASE WHEN p.progress_id IS NOT NULL THEN lv.vocab_id ELSE NULL END) as total_learned,
                COUNT(DISTINCT CASE WHEN p.is_memorized = 1 THEN lv.vocab_id ELSE NULL END) as total_memorized
                FROM TopicLessons tl
                JOIN LessonVocabulary lv ON tl.lesson_id = lv.lesson_id
                LEFT JOIN Progress p ON lv.vocab_id = p.vocab_id AND p.user_id = :user_id
                WHERE tl.topic_id = :topic_id";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindParam(':topic_id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $progress = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Tính phần trăm hoàn thành
        $completed_percentage = ($total > 0) ? 
            round(($progress['total_memorized'] / $total) * 100, 1) : 0;
        
        // Thêm thông tin tiến độ vào kết quả
        $topic['total_words'] = (int)$total;
        $topic['total_learned'] = (int)$progress['total_learned'];
        $topic['total_memorized'] = (int)$progress['total_memorized'];
        $topic['completed_percentage'] = $completed_percentage;
        
        // Lấy thông tin số bài học
        $sql = "SELECT COUNT(*) as lesson_count FROM TopicLessons tl 
                JOIN Lessons l ON tl.lesson_id = l.lesson_id 
                WHERE tl.topic_id = :topic_id AND l.is_active = 1";
        $stmt = $this->db->prepare($sql);
        $stmt->bindParam(':topic_id', $id, PDO::PARAM_INT);
        $stmt->execute();
        $topic['lesson_count'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['lesson_count'];
        
        return ['status' => 'success', 'data' => $topic];
    }

    // Lấy tất cả chủ đề với tiến độ học của user
    public function getAllTopicsWithProgress($user_id) {
        $topics = $this->topic->getAllActive();
        
        if (!$topics) {
            return ['status' => 'success', 'data' => []];
        }
        
        foreach ($topics as &$topic) {
            // Đếm tổng số từ trong chủ đề
            $sql = "SELECT COUNT(DISTINCT lv.vocab_id) as total
                    FROM TopicLessons tl
                    JOIN LessonVocabulary lv ON tl.lesson_id = lv.lesson_id
                    WHERE tl.topic_id = :topic_id";
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':topic_id', $topic['topic_id'], PDO::PARAM_INT);
            $stmt->execute();
            $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Đếm số từ user đã học và thuộc
            $sql = "SELECT 
                    COUNT(DISTINCT CASE WHEN p.progress_id IS NOT NULL THEN lv.vocab_id ELSE NULL END) as total_learned,
                    COUNT(DISTINCT CASE WHEN p.is_memorized = 1 THEN lv.vocab_id ELSE NULL END) as total_memorized
                    FROM TopicLessons tl
                    JOIN LessonVocabulary lv ON tl.lesson_id = lv.lesson_id
                    LEFT JOIN Progress p ON lv.vocab_id = p.vocab_id AND p.user_id = :user_id
                    WHERE tl.topic_id = :topic_id";
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->bindParam(':topic_id', $topic['topic_id'], PDO::PARAM_INT);
            $stmt->execute();
            $progress = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Tính phần trăm hoàn thành
            $completed_percentage = ($total > 0) ? 
                round(($progress['total_memorized'] / $total) * 100, 1) : 0;
            
            // Thêm thông tin tiến độ vào kết quả
            $topic['total_words'] = (int)$total;
            $topic['total_learned'] = (int)$progress['total_learned'];
            $topic['total_memorized'] = (int)$progress['total_memorized'];
            $topic['completed_percentage'] = $completed_percentage;
            
            // Lấy thông tin số bài học
            $sql = "SELECT COUNT(*) as lesson_count FROM TopicLessons tl 
                    JOIN Lessons l ON tl.lesson_id = l.lesson_id 
                    WHERE tl.topic_id = :topic_id AND l.is_active = 1";
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':topic_id', $topic['topic_id'], PDO::PARAM_INT);
            $stmt->execute();
            $topic['lesson_count'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['lesson_count'];
            
            // Đếm số bài học đã hoàn thành
            $sql = "SELECT COUNT(*) as completed_lessons
                    FROM TopicLessons tl
                    JOIN LessonProgress lp ON tl.lesson_id = lp.lesson_id AND lp.user_id = :user_id AND lp.is_completed = 1
                    WHERE tl.topic_id = :topic_id";
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->bindParam(':topic_id', $topic['topic_id'], PDO::PARAM_INT);
            $stmt->execute();
            $topic['completed_lessons'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['completed_lessons'];
        }
        
        return ['status' => 'success', 'data' => $topics];
    }
}
?>