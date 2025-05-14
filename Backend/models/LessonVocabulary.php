<?php
    class LessonVocabulary {
        private $conn;
        private $table_name = "LessonVocabulary";
        
        public $lesson_vocab_id;
        public $lesson_id;
        public $vocab_id;
        public $display_order;
        public $custom_meaning;
        public $custom_example;
        
        public function __construct($db) {
            $this->conn = $db;
        }
        
        // Thêm liên kết giữa bài học và từ vựng
        public function create() {
            $query = "INSERT INTO " . $this->table_name . "
                      SET lesson_id=:lesson_id, vocab_id=:vocab_id, 
                          display_order=:display_order, custom_meaning=:custom_meaning, 
                          custom_example=:custom_example";
            
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(":lesson_id", $this->lesson_id);
            $stmt->bindParam(":vocab_id", $this->vocab_id);
            $stmt->bindParam(":display_order", $this->display_order);
            $stmt->bindParam(":custom_meaning", $this->custom_meaning);
            $stmt->bindParam(":custom_example", $this->custom_example);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        }
    }
?>