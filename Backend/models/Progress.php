<?php
// models/Progress.php
// Model xử lý dữ liệu tiến độ học tập

class Progress {
    private $conn;
    private $vocab_progress_table = 'Progress';
    private $lesson_progress_table = 'LessonProgress';
    private $topic_progress_table = 'TopicProgress';
    
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

    // === VĂN PHẠM TỪ VỰNG ===

    // Lấy tiến độ học từ vựng theo user_id và vocab_id
    public function getProgressByUserAndVocab($user_id, $vocab_id) {
        $query = "SELECT * FROM " . $this->vocab_progress_table . " 
                  WHERE user_id = :user_id AND vocab_id = :vocab_id";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindParam(':vocab_id', $vocab_id, PDO::PARAM_INT);
        
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Tạo mới tiến độ học từ vựng
    public function createVocabProgress($user_id, $vocab_id) {
        $query = "INSERT INTO " . $this->vocab_progress_table . " SET
                  user_id = :user_id,
                  vocab_id = :vocab_id,
                  is_memorized = :is_memorized,
                  review_count = :review_count,
                  last_review_date = NOW()";
        
        $stmt = $this->conn->prepare($query);
        
        // Khởi tạo các giá trị mặc định
        $is_memorized = 0;
        $review_count = 0;
        
        // Sử dụng PDO::PARAM_INT để đảm bảo binding giá trị số nguyên
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindParam(':vocab_id', $vocab_id, PDO::PARAM_INT);
        $stmt->bindParam(':is_memorized', $is_memorized, PDO::PARAM_INT);
        $stmt->bindParam(':review_count', $review_count, PDO::PARAM_INT);
        
        return $stmt->execute();
    }

    // Cập nhật tiến độ học từ vựng
    public function updateVocabProgress($user_id, $vocab_id, $is_memorized) {
        // Đảm bảo is_memorized là số nguyên
        $is_memorized = (int)$is_memorized;
        
        $query = "UPDATE " . $this->vocab_progress_table . " SET
                  is_memorized = :is_memorized,
                  review_count = review_count + 1,
                  last_review_date = NOW()
                  WHERE user_id = :user_id AND vocab_id = :vocab_id";
        
        $stmt = $this->conn->prepare($query);
        
        // Sử dụng PDO::PARAM_INT để đảm bảo binding giá trị số nguyên
        $stmt->bindParam(':is_memorized', $is_memorized, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindParam(':vocab_id', $vocab_id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }

    // Lấy danh sách tiến độ học từ vựng của user
    public function getUserVocabProgress($user_id) {
        $query = "SELECT p.*, v.word, v.meaning 
                  FROM " . $this->vocab_progress_table . " p
                  JOIN Vocabulary v ON p.vocab_id = v.vocab_id
                  WHERE p.user_id = :user_id
                  ORDER BY p.last_review_date DESC";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Lấy số liệu thống kê tiến độ từ vựng
    public function getVocabProgressStats($user_id) {
        $query = "SELECT 
                  COUNT(DISTINCT vocab_id) as total_learned,
                  SUM(CASE WHEN is_memorized = 1 THEN 1 ELSE 0 END) as total_memorized
                  FROM " . $this->vocab_progress_table . " 
                  WHERE user_id = :user_id";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Lấy từ vựng cần ôn tập
    public function getWordsToReview($user_id, $limit) {
        $query = "SELECT p.*, v.word, v.meaning, v.example, v.pronunciation, v.word_type, v.audio
                  FROM " . $this->vocab_progress_table . " p
                  JOIN Vocabulary v ON p.vocab_id = v.vocab_id
                  WHERE p.user_id = :user_id AND p.is_memorized = 0
                  ORDER BY p.last_review_date ASC
                  LIMIT :limit";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // === TIẾN ĐỘ BÀI HỌC ===
    
    // Kiểm tra xem tiến độ bài học đã tồn tại chưa
    public function getLessonProgress($user_id, $lesson_id) {
        $query = "SELECT * FROM " . $this->lesson_progress_table . " 
                  WHERE user_id = :user_id AND lesson_id = :lesson_id";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindParam(':lesson_id', $lesson_id, PDO::PARAM_INT);
        
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // Tạo mới tiến độ bài học
    public function createLessonProgress($user_id, $lesson_id) {
        $query = "INSERT INTO " . $this->lesson_progress_table . " SET
                  user_id = :user_id,
                  lesson_id = :lesson_id,
                  is_completed = 0,
                  completion_date = NULL";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindParam(':lesson_id', $lesson_id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }
    
    // Cập nhật tiến độ bài học
    public function completeLessonProgress($user_id, $lesson_id) {
        $query = "UPDATE " . $this->lesson_progress_table . " SET
                  is_completed = 1,
                  completion_date = NOW()
                  WHERE user_id = :user_id AND lesson_id = :lesson_id";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindParam(':lesson_id', $lesson_id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }
    
    // Lấy danh sách bài học đã hoàn thành của user
    public function getUserCompletedLessons($user_id) {
        $query = "SELECT lp.*, l.title 
                  FROM " . $this->lesson_progress_table . " lp
                  JOIN Lessons l ON lp.lesson_id = l.lesson_id
                  WHERE lp.user_id = :user_id AND lp.is_completed = 1
                  ORDER BY lp.completion_date DESC";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Tính phần trăm hoàn thành bài học
    public function calculateLessonCompletion($user_id, $lesson_id) {
        // Lấy tổng số từ vựng trong bài học
        $query = "SELECT COUNT(*) as total_words FROM LessonVocabulary WHERE lesson_id = :lesson_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':lesson_id', $lesson_id, PDO::PARAM_INT);
        $stmt->execute();
        $total_words = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total_words'];
        
        if ($total_words === 0) {
            return 0;
        }
        
        // Lấy số từ vựng đã thuộc
        $query = "SELECT COUNT(*) as memorized_words 
                  FROM LessonVocabulary lv
                  JOIN " . $this->vocab_progress_table . " p ON lv.vocab_id = p.vocab_id
                  WHERE lv.lesson_id = :lesson_id AND p.user_id = :user_id AND p.is_memorized = 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':lesson_id', $lesson_id, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->execute();
        $memorized_words = (int)$stmt->fetch(PDO::FETCH_ASSOC)['memorized_words'];
        
        // Tính phần trăm hoàn thành
        $percentage = ($memorized_words / $total_words) * 100;
        
        // Làm tròn đến 1 chữ số thập phân và đảm bảo không vượt quá 100%
        return round(min(100, $percentage), 1);
    }

    // === TIẾN ĐỘ CHỦ ĐỀ ===
    
    // Kiểm tra xem tiến độ chủ đề đã tồn tại chưa
    public function getTopicProgress($user_id, $topic_id) {
        $query = "SELECT * FROM " . $this->topic_progress_table . " 
                  WHERE user_id = :user_id AND topic_id = :topic_id";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindParam(':topic_id', $topic_id, PDO::PARAM_INT);
        
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // Tạo mới hoặc cập nhật tiến độ chủ đề
    public function updateTopicProgress($user_id, $topic_id) {
        // Lấy tổng số bài học của chủ đề
        $query = "SELECT COUNT(*) as total_lessons FROM TopicLessons WHERE topic_id = :topic_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':topic_id', $topic_id, PDO::PARAM_INT);
        $stmt->execute();
        $total_lessons = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total_lessons'];
        
        // Lấy số bài học đã hoàn thành
        $query = "SELECT COUNT(*) as completed_lessons 
                  FROM " . $this->lesson_progress_table . " lp
                  JOIN TopicLessons tl ON lp.lesson_id = tl.lesson_id
                  WHERE tl.topic_id = :topic_id AND lp.user_id = :user_id AND lp.is_completed = 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':topic_id', $topic_id, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->execute();
        $completed_lessons = (int)$stmt->fetch(PDO::FETCH_ASSOC)['completed_lessons'];
        
        // Tính phần trăm hoàn thành
        $completed_percentage = ($total_lessons > 0) ? 
            round(($completed_lessons / $total_lessons) * 100, 1) : 0;
        
        // Cập nhật hoặc tạo mới bản ghi tiến độ chủ đề
        $query = "INSERT INTO " . $this->topic_progress_table . " 
                  (user_id, topic_id, completed_lessons, total_lessons, completed_percentage)
                  VALUES (:user_id, :topic_id, :completed_lessons, :total_lessons, :completed_percentage)
                  ON DUPLICATE KEY UPDATE
                  completed_lessons = :completed_lessons,
                  total_lessons = :total_lessons,
                  completed_percentage = :completed_percentage";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindParam(':topic_id', $topic_id, PDO::PARAM_INT);
        $stmt->bindParam(':completed_lessons', $completed_lessons, PDO::PARAM_INT);
        $stmt->bindParam(':total_lessons', $total_lessons, PDO::PARAM_INT);
        $stmt->bindParam(':completed_percentage', $completed_percentage);
        
        return $stmt->execute();
    }
    
    // Lấy danh sách tiến độ chủ đề của user
    public function getUserTopicsProgress($user_id) {
        $query = "SELECT tp.*, t.topic_name 
                  FROM " . $this->topic_progress_table . " tp
                  JOIN Topics t ON tp.topic_id = t.topic_id
                  WHERE tp.user_id = :user_id
                  ORDER BY tp.completed_percentage DESC";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>