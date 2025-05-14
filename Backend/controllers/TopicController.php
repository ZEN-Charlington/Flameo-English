<?php

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
            return ['status' => 'success', 'data' => $result];
        } else {
            return ['status' => 'error', 'message' => 'Không tìm thấy chủ đề'];
        }
    }

    // Lấy chủ đề theo ID
    public function getTopic($id) {
        $result = $this->topic->getById($id);
        if ($result) {
            return ['status' => 'success', 'data' => $result];
        } else {
            return ['status' => 'error', 'message' => 'Không tìm thấy chủ đề'];
        }
    }

    // Lấy tất cả chủ đề với tiến độ học của user
    public function getTopicsWithProgress($user_id) {
        $topics = $this->topic->getAllActive();
        
        if (!$topics) {
            return ['status' => 'error', 'message' => 'Không tìm thấy chủ đề'];
        }
        
        foreach ($topics as &$topic) {
            // Đếm tổng số từ trong chủ đề
            $sql = "SELECT COUNT(DISTINCT lv.vocab_id) as total
                    FROM TopicLessons tl
                    JOIN LessonVocabulary lv ON tl.lesson_id = lv.lesson_id
                    WHERE tl.topic_id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->bind_param("i", $topic['topic_id']);
            $stmt->execute();
            $total = $stmt->get_result()->fetch_assoc()['total'];
            
            // Đếm số từ user đã học và thuộc
            $sql = "SELECT 
                    COUNT(DISTINCT lv.vocab_id) as total_learned,
                    SUM(CASE WHEN p.is_memorized = 1 THEN 1 ELSE 0 END) as total_memorized
                    FROM TopicLessons tl
                    JOIN LessonVocabulary lv ON tl.lesson_id = lv.lesson_id
                    LEFT JOIN Progress p ON lv.vocab_id = p.vocab_id AND p.user_id = ?
                    WHERE tl.topic_id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->bind_param("ii", $user_id, $topic['topic_id']);
            $stmt->execute();
            $progress = $stmt->get_result()->fetch_assoc();
            
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
                    WHERE tl.topic_id = ? AND l.is_active = 1";
            $stmt = $this->db->prepare($sql);
            $stmt->bind_param("i", $topic['topic_id']);
            $stmt->execute();
            $topic['lesson_count'] = (int)$stmt->get_result()->fetch_assoc()['lesson_count'];
        }
        
        return ['status' => 'success', 'data' => $topics];
    }
}