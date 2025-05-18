<?php
    class TopicLesson {
        private $conn;
        private $table_name = "TopicLessons";
        
        public $topic_lesson_id;
        public $topic_id;
        public $lesson_id;
        
        public function __construct($db) {
            $this->conn = $db;
        }
        
        // Thêm liên kết giữa chủ đề và bài học
        public function create() {
            $query = "INSERT INTO " . $this->table_name . "
                      SET topic_id=:topic_id, lesson_id=:lesson_id";
            
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(":topic_id", $this->topic_id);
            $stmt->bindParam(":lesson_id", $this->lesson_id);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        }
        
        // Lấy thông tin theo lesson_id
        public function getByLessonId($lesson_id) {
            $query = "SELECT * FROM " . $this->table_name . " WHERE lesson_id = :lesson_id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":lesson_id", $lesson_id);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        // Lấy danh sách bài học theo topic_id
        public function getLessonsByTopicId($topic_id) {
            $query = "SELECT tl.*, l.title, l.display_order, l.is_active
                      FROM " . $this->table_name . " tl
                      JOIN Lessons l ON tl.lesson_id = l.lesson_id
                      WHERE tl.topic_id = :topic_id
                      ORDER BY l.display_order";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":topic_id", $topic_id);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        // Xóa liên kết giữa chủ đề và bài học
        public function delete($topic_id, $lesson_id) {
            $query = "DELETE FROM " . $this->table_name . " 
                      WHERE topic_id = :topic_id AND lesson_id = :lesson_id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":topic_id", $topic_id);
            $stmt->bindParam(":lesson_id", $lesson_id);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        }
    }
?>