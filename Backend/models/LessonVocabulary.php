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
    
    // Lấy danh sách từ vựng theo lesson_id
    public function getByLessonId($lesson_id) {
        $query = "SELECT lv.*, v.word, v.meaning, v.pronunciation, v.example, v.audio, v.word_type, v.difficulty_level 
                  FROM " . $this->table_name . " lv
                  JOIN Vocabulary v ON lv.vocab_id = v.vocab_id
                  WHERE lv.lesson_id = :lesson_id
                  ORDER BY lv.display_order";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':lesson_id', $lesson_id, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Thêm liên kết giữa bài học và từ vựng
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                  SET lesson_id = :lesson_id, vocab_id = :vocab_id, 
                      display_order = :display_order, custom_meaning = :custom_meaning, 
                      custom_example = :custom_example";
        
        $stmt = $this->conn->prepare($query);
        
        // Bind data
        $stmt->bindParam(':lesson_id', $this->lesson_id);
        $stmt->bindParam(':vocab_id', $this->vocab_id);
        $stmt->bindParam(':display_order', $this->display_order);
        $stmt->bindParam(':custom_meaning', $this->custom_meaning);
        $stmt->bindParam(':custom_example', $this->custom_example);
        
        // Execute query
        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        
        return false;
    }
    
    // Xóa liên kết giữa bài học và từ vựng
    public function delete($lesson_id, $vocab_id) {
        $query = "DELETE FROM " . $this->table_name . " 
                  WHERE lesson_id = :lesson_id AND vocab_id = :vocab_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':lesson_id', $lesson_id);
        $stmt->bindParam(':vocab_id', $vocab_id);
        
        return $stmt->execute();
    }
    
    // Cập nhật thứ tự hiển thị
    public function updateDisplayOrder($lesson_id, $vocab_id, $display_order) {
        $query = "UPDATE " . $this->table_name . " 
                  SET display_order = :display_order
                  WHERE lesson_id = :lesson_id AND vocab_id = :vocab_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':display_order', $display_order);
        $stmt->bindParam(':lesson_id', $lesson_id);
        $stmt->bindParam(':vocab_id', $vocab_id);
        
        return $stmt->execute();
    }
}
?>