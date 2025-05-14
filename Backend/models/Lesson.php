<?php
    class Lesson {
        private $conn;
        private $table_name = "Lessons";
        
        public $lesson_id;
        public $title;
        public $display_order;
        public $is_active;
        
        public function __construct($db) {
            $this->conn = $db;
        }
        
        // Thêm bài học mới
        public function create() {
            $query = "INSERT INTO " . $this->table_name . "
                      SET title=:title, display_order=:display_order, is_active=:is_active";
            
            $stmt = $this->conn->prepare($query);
            
            $this->title = htmlspecialchars(strip_tags($this->title));
            
            $stmt->bindParam(":title", $this->title);
            $stmt->bindParam(":display_order", $this->display_order);
            $stmt->bindParam(":is_active", $this->is_active);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        }
    }
?>