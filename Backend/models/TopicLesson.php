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
    }
    
?>