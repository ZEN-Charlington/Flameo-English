<?php

class ProgressController {
    private $db;
    private $progress;
    private $vocabulary;

    public function __construct($db) {
        $this->db = $db;
        $this->progress = new Progress($db);
        $this->vocabulary = new Vocabulary($db);
    }

    // Lấy tiến độ học của user
    public function getUserProgress($user_id) {
        $result = $this->progress->getUserProgress($user_id);
        
        if($result) {
            return [
                'status' => 200,
                'data' => $result
            ];
        } else {
            return [
                'status' => 200,
                'data' => [],
                'message' => 'Chưa có dữ liệu tiến độ học'
            ];
        }
    }

    // Cập nhật tiến độ học của từ vựng
    public function updateVocabProgress($user_id, $vocab_id, $is_memorized) {
        // Kiểm tra từ vựng có tồn tại không
        $vocab = $this->vocabulary->getById($vocab_id);
        if (!$vocab) {
            return [
                'status' => 404,
                'message' => 'Từ vựng không tồn tại'
            ];
        }
        
        // Kiểm tra tiến độ đã tồn tại chưa
        $existing = $this->progress->getProgressByUserAndVocab($user_id, $vocab_id);
        
        if ($existing) {
            // Cập nhật tiến độ
            $result = $this->progress->update($user_id, $vocab_id, $is_memorized);
        } else {
            // Tạo mới và cập nhật
            $this->progress->create($user_id, $vocab_id);
            $result = $this->progress->update($user_id, $vocab_id, $is_memorized);
        }
        
        if ($result) {
            return [
                'status' => 200,
                'message' => 'Cập nhật tiến độ học thành công'
            ];
        } else {
            return [
                'status' => 500,
                'message' => 'Không thể cập nhật tiến độ học'
            ];
        }
    }

    // Lấy thống kê tiến độ học
    public function getProgressStats($user_id) {
        $stats = $this->progress->getProgressStats($user_id);
        
        // Lấy tổng số từ vựng trong database
        $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM Vocabulary");
        $stmt->execute();
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        $data = [
            'total_learned' => (int)$stats['total_learned'] ?? 0,
            'total_memorized' => (int)$stats['total_memorized'] ?? 0,
            'total_words' => (int)$total,
            'percentage' => 0
        ];
        
        // Tính phần trăm hoàn thành
        if ($total > 0) {
            $data['percentage'] = round(($data['total_memorized'] / $total) * 100, 1);
        }
        
        return [
            'status' => 200,
            'data' => $data
        ];
    }

    // Lấy danh sách từ vựng cần ôn tập
    public function getWordsToReview($user_id, $limit = 10) {
        $words = $this->progress->getWordsToReview($user_id, $limit);
        
        if ($words) {
            return [
                'status' => 200,
                'data' => $words
            ];
        } else {
            // Nếu không có từ nào cần ôn tập, lấy từ mới
            $stmt = $this->db->prepare("SELECT v.vocab_id, v.word, v.meaning, v.example, v.pronunciation, v.word_type, v.audio
                                        FROM Vocabulary v
                                        LEFT JOIN Progress p ON v.vocab_id = p.vocab_id AND p.user_id = :user_id
                                        WHERE p.progress_id IS NULL
                                        ORDER BY RAND()
                                        LIMIT :limit");
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            $newWords = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if ($newWords) {
                return [
                    'status' => 200,
                    'data' => $newWords,
                    'message' => 'Từ mới chưa học'
                ];
            } else {
                return [
                    'status' => 200,
                    'data' => [],
                    'message' => 'Bạn đã học hết tất cả các từ'
                ];
            }
        }
    }
}
?>