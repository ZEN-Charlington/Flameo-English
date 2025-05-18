<?php

require_once __DIR__ . '/../models/Vocabulary.php';
require_once __DIR__ . '/../models/Progress.php';

class VocabularyController {
    private $db;
    private $vocabulary;
    private $progress;

    // Hàm khởi tạo
    public function __construct($db) {
        $this->db = $db;
        $this->vocabulary = new Vocabulary($db);
        $this->progress = new Progress($db);
    }

    // Lấy tất cả từ vựng
    public function getAllVocabulary() {
        $result = $this->vocabulary->getAll();
        if ($result) {
            return ['status' => 'success', 'data' => $result];
        } else {
            return ['status' => 'error', 'message' => 'Không tìm thấy từ vựng'];
        }
    }

    // Lấy từ vựng theo ID
    public function getVocabulary($id) {
        $result = $this->vocabulary->getById($id);
        if ($result) {
            return ['status' => 'success', 'data' => $result];
        } else {
            return ['status' => 'error', 'message' => 'Không tìm thấy từ vựng'];
        }
    }

    // Lấy từ vựng theo ID với thông tin tiến độ của user
    public function getVocabularyWithProgress($id, $user_id) {
        $vocab = $this->vocabulary->getById($id);
        
        if (!$vocab) {
            return ['status' => 'error', 'message' => 'Không tìm thấy từ vựng'];
        }
        
        // Lấy thông tin tiến độ học
        $progress = $this->progress->getProgressByUserAndVocab($user_id, $id);
        
        if ($progress) {
            $vocab['is_memorized'] = $progress['is_memorized'];
            $vocab['review_count'] = $progress['review_count'];
            $vocab['last_review_date'] = $progress['last_review_date'];
        } else {
            $vocab['is_memorized'] = 0;
            $vocab['review_count'] = 0;
            $vocab['last_review_date'] = null;
        }
        
        return ['status' => 'success', 'data' => $vocab];
    }

    // Tìm kiếm từ vựng
    public function searchVocabulary($keyword, $user_id = null) {
        $keyword = '%' . $keyword . '%';
        
        if ($user_id) {
            // Tìm kiếm với thông tin tiến độ
            $sql = "SELECT v.*, p.is_memorized, p.review_count, p.last_review_date
                    FROM Vocabulary v
                    LEFT JOIN Progress p ON v.vocab_id = p.vocab_id AND p.user_id = ?
                    WHERE v.word LIKE ? OR v.meaning LIKE ?
                    ORDER BY v.word";
            $stmt = $this->db->prepare($sql);
            $stmt->bind_param("iss", $user_id, $keyword, $keyword);
        } else {
            // Tìm kiếm không có thông tin tiến độ
            $sql = "SELECT * FROM Vocabulary 
                    WHERE word LIKE ? OR meaning LIKE ?
                    ORDER BY word";
            $stmt = $this->db->prepare($sql);
            $stmt->bind_param("ss", $keyword, $keyword);
        }
        
        $stmt->execute();
        $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        
        if ($result) {
            return ['status' => 'success', 'data' => $result];
        } else {
            return ['status' => 'error', 'message' => 'Không tìm thấy kết quả phù hợp'];
        }
    }

    // Lấy từ vựng ngẫu nhiên để học
    public function getRandomVocabulary($limit = 10, $user_id = null) {
        if ($user_id) {
            // Lấy từ chưa học hoặc chưa thuộc
            $sql = "SELECT v.*
                    FROM Vocabulary v
                    LEFT JOIN Progress p ON v.vocab_id = p.vocab_id AND p.user_id = ?
                    WHERE p.progress_id IS NULL OR p.is_memorized = 0
                    ORDER BY RAND()
                    LIMIT ?";
            $stmt = $this->db->prepare($sql);
            $stmt->bind_param("ii", $user_id, $limit);
        } else {
            // Lấy ngẫu nhiên không có thông tin tiến độ
            $sql = "SELECT * FROM Vocabulary ORDER BY RAND() LIMIT ?";
            $stmt = $this->db->prepare($sql);
            $stmt->bind_param("i", $limit);
        }
        
        $stmt->execute();
        $result = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        
        if ($result) {
            return ['status' => 'success', 'data' => $result];
        } else {
            return ['status' => 'error', 'message' => 'Không thể lấy từ vựng ngẫu nhiên'];
        }
    }

    public function getVocabularyStatsByType($user_id) {
        try {
            // SQL để lấy thống kê từ vựng theo loại từ (word_type)
            $query = "
                SELECT 
                    COALESCE(v.word_type, 'Chưa phân loại') AS word_type,
                    COUNT(v.vocab_id) AS total,
                    SUM(CASE WHEN p.is_memorized = 1 THEN 1 ELSE 0 END) AS memorized
                FROM Vocabulary v
                JOIN Progress p ON v.vocab_id = p.vocab_id
                WHERE p.user_id = :user_id
                GROUP BY v.word_type
                ORDER BY 
                    CASE WHEN v.word_type IS NULL THEN 1 ELSE 0 END,
                    v.word_type
            ";
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->execute();
            $stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Xử lý chuẩn hóa dữ liệu
            $formattedStats = [];
            foreach ($stats as $item) {
                // Chuẩn hóa loại từ: Viết hoa chữ cái đầu, xử lý null
                $type = $item['word_type'];
                if ($type === null || trim($type) === '') {
                    $type = 'Chưa phân loại';
                } else {
                    // Chuyển về chữ thường và viết hoa chữ cái đầu
                    $type = ucfirst(strtolower(trim($type)));
                }
                
                $formattedStats[] = [
                    'type' => $type,
                    'total' => (int)$item['total'],
                    'memorized' => (int)$item['memorized']
                ];
            }
            
            return [
                'status' => 200,
                'data' => $formattedStats
            ];
        } catch (Exception $e) {
            return [
                'status' => 500,
                'message' => 'Lỗi khi lấy thống kê từ vựng theo loại: ' . $e->getMessage()
            ];
        }
    }
}