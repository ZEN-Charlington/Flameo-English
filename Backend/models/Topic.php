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
        
        // Lấy tất cả chủ đề đang hoạt động (is_active = 1)
        public function getAllActive() {
            $query = "SELECT * FROM " . $this->table_name . " 
                     WHERE is_active = 1 
                     ORDER BY display_order";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        // Lấy thông tin chủ đề theo ID
        public function getById($id) {
            $query = "SELECT * FROM " . $this->table_name . " WHERE topic_id = :topic_id";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":topic_id", $id);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        // Cập nhật thông tin chủ đề
        public function update() {
            $query = "UPDATE " . $this->table_name . "
                     SET topic_name = :topic_name,
                         description = :description,
                         display_order = :display_order,
                         is_active = :is_active
                     WHERE topic_id = :topic_id";
            
            $stmt = $this->conn->prepare($query);
            
            $this->topic_name = htmlspecialchars(strip_tags($this->topic_name));
            $this->description = htmlspecialchars(strip_tags($this->description));
            $this->topic_id = htmlspecialchars(strip_tags($this->topic_id));
            
            $stmt->bindParam(":topic_name", $this->topic_name);
            $stmt->bindParam(":description", $this->description);
            $stmt->bindParam(":display_order", $this->display_order);
            $stmt->bindParam(":is_active", $this->is_active);
            $stmt->bindParam(":topic_id", $this->topic_id);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        }
        
        // Lấy tất cả chủ đề (bao gồm cả is_active = 0)
        public function getAll() {
            $query = "SELECT * FROM " . $this->table_name . " ORDER BY display_order";
            
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
?>