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
    
    // Lấy tất cả bài học
    public function getAll() {
        $query = "SELECT * FROM " . $this->table_name . " WHERE is_active = 1 ORDER BY display_order";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Lấy bài học theo ID
    public function getById($id) {
        $query = "SELECT * FROM " . $this->table_name . " WHERE lesson_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // Thêm bài học mới
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET title = :title, display_order = :display_order, is_active = :is_active";
        
        $stmt = $this->conn->prepare($query);
        
        // Sanitize
        $this->title = htmlspecialchars(strip_tags($this->title));
        
        // Bind data
        $stmt->bindParam(':title', $this->title);
        $stmt->bindParam(':display_order', $this->display_order);
        $stmt->bindParam(':is_active', $this->is_active);
        
        // Execute query
        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        
        return false;
    }
    
    // Cập nhật bài học
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                  SET title = :title, display_order = :display_order, is_active = :is_active
                  WHERE lesson_id = :lesson_id";
        
        $stmt = $this->conn->prepare($query);
        
        // Sanitize
        $this->title = htmlspecialchars(strip_tags($this->title));
        
        // Bind data
        $stmt->bindParam(':title', $this->title);
        $stmt->bindParam(':display_order', $this->display_order);
        $stmt->bindParam(':is_active', $this->is_active);
        $stmt->bindParam(':lesson_id', $this->lesson_id);
        
        // Execute query
        return $stmt->execute();
    }
}
?>