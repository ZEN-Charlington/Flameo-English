<?php
// models/Progress.php
// Model xử lý dữ liệu bảng Progress

class Progress {
    private $conn;
    private $table = 'Progress';

    // Các thuộc tính
    public $progress_id;
    public $user_id;
    public $vocab_id;
    public $is_memorized;
    public $review_count;
    public $last_review_date;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Lấy tiến độ học theo user_id và vocab_id
    public function getProgressByUserAndVocab($user_id, $vocab_id) {
        $query = "SELECT * FROM " . $this->table . " 
                  WHERE user_id = :user_id AND vocab_id = :vocab_id";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':vocab_id', $vocab_id);
        
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Tạo mới tiến độ học
    public function create($user_id, $vocab_id) {
        $query = "INSERT INTO " . $this->table . " SET
                  user_id = :user_id,
                  vocab_id = :vocab_id,
                  is_memorized = :is_memorized,
                  review_count = :review_count";
        
        $stmt = $this->conn->prepare($query);
        
        $is_memorized = 0;
        $review_count = 0;
        
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':vocab_id', $vocab_id);
        $stmt->bindParam(':is_memorized', $is_memorized);
        $stmt->bindParam(':review_count', $review_count);
        
        if($stmt->execute()) {
            return true;
        }
        
        return false;
    }

    // Cập nhật tiến độ học
    public function update($user_id, $vocab_id, $is_memorized) {
        $query = "UPDATE " . $this->table . " SET
                  is_memorized = :is_memorized,
                  review_count = review_count + 1,
                  last_review_date = NOW()
                  WHERE user_id = :user_id AND vocab_id = :vocab_id";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':is_memorized', $is_memorized);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':vocab_id', $vocab_id);
        
        if($stmt->execute()) {
            return true;
        }
        
        return false;
    }

    // Lấy danh sách tiến độ học của user
    public function getUserProgress($user_id) {
        $query = "SELECT p.*, v.word, v.meaning 
                  FROM " . $this->table . " p
                  JOIN Vocabulary v ON p.vocab_id = v.vocab_id
                  WHERE p.user_id = :user_id
                  ORDER BY p.last_review_date DESC";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':user_id', $user_id);
        
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Lấy số liệu thống kê tiến độ
    public function getProgressStats($user_id) {
        $query = "SELECT 
                  COUNT(DISTINCT vocab_id) as total_learned,
                  SUM(CASE WHEN is_memorized = 1 THEN 1 ELSE 0 END) as total_memorized
                  FROM " . $this->table . " 
                  WHERE user_id = :user_id";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':user_id', $user_id);
        
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Lấy từ vựng cần ôn tập
    public function getWordsToReview($user_id, $limit) {
        $query = "SELECT p.*, v.word, v.meaning, v.example, v.pronunciation, v.word_type, v.audio
                  FROM " . $this->table . " p
                  JOIN Vocabulary v ON p.vocab_id = v.vocab_id
                  WHERE p.user_id = :user_id AND p.is_memorized = 0
                  ORDER BY p.last_review_date ASC
                  LIMIT :limit";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>