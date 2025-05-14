<?php
    class Topic {
        private $conn;
        private $table_name = "Topics";
        
        public $topic_id;
        public $topic_name;
        public $description;
        public $display_order;
        public $is_active;
        
        public function __construct($db) {
            $this->conn = $db;
        }
        
        // Thêm chủ đề mới
        public function create() {
            $query = "INSERT INTO " . $this->table_name . "
                      SET topic_name=:topic_name, description=:description, 
                          display_order=:display_order, is_active=:is_active";
            
            $stmt = $this->conn->prepare($query);
            
            $this->topic_name = htmlspecialchars(strip_tags($this->topic_name));
            $this->description = htmlspecialchars(strip_tags($this->description));
            
            $stmt->bindParam(":topic_name", $this->topic_name);
            $stmt->bindParam(":description", $this->description);
            $stmt->bindParam(":display_order", $this->display_order);
            $stmt->bindParam(":is_active", $this->is_active);
            
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }
            return false;
        }
    }
?>