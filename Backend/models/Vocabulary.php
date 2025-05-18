<?php
    class Vocabulary {
        private $conn;
        private $table_name = "Vocabulary";

        public $vocab_id;
        public $word;
        public $meaning;
        public $audio;
        public $pronunciation;
        public $example;
        public $difficulty_level;
        public $word_type;

        public function __construct($db) {
            $this->conn = $db;
        }

        // Thêm từ mới vào database
        public function create() {
            $query = "INSERT INTO " . $this->table_name . "
                    SET word=:word, meaning=:meaning, audio=:audio, 
                        pronunciation=:pronunciation, example=:example, 
                        difficulty_level=:difficulty_level, word_type=:word_type";

            $stmt = $this->conn->prepare($query);

            // Làm sạch dữ liệu
            $this->word = htmlspecialchars(strip_tags($this->word));
            $this->meaning = htmlspecialchars(strip_tags($this->meaning));
            $this->audio = htmlspecialchars(strip_tags($this->audio));
            $this->pronunciation = htmlspecialchars(strip_tags($this->pronunciation));
            $this->example = htmlspecialchars(strip_tags($this->example));
            $this->difficulty_level = htmlspecialchars(strip_tags($this->difficulty_level));
            $this->word_type = htmlspecialchars(strip_tags($this->word_type));

            // Bind dữ liệu
            $stmt->bindParam(":word", $this->word);
            $stmt->bindParam(":meaning", $this->meaning);
            $stmt->bindParam(":audio", $this->audio);
            $stmt->bindParam(":pronunciation", $this->pronunciation);
            $stmt->bindParam(":example", $this->example);
            $stmt->bindParam(":difficulty_level", $this->difficulty_level);
            $stmt->bindParam(":word_type", $this->word_type);

            // Thực thi truy vấn
            if($stmt->execute()) {
                return true;
            }
            return false;
        }

        // Kiểm tra xem từ đã tồn tại chưa
        public function wordExists() {
            $query = "SELECT vocab_id FROM " . $this->table_name . " WHERE word = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(1, $this->word);
            $stmt->execute();
            
            if($stmt->rowCount() > 0) {
                return true;
            }
            return false;
        }
        
        // Lấy tất cả từ vựng
        public function getAll() {
            $query = "SELECT * FROM " . $this->table_name . " ORDER BY word";
            $stmt = $this->conn->prepare($query);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        // Lấy từ vựng theo ID
        public function getById($id) {
            $query = "SELECT * FROM " . $this->table_name . " WHERE vocab_id = :id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":id", $id);
            $stmt->execute();
            
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        // Cập nhật từ vựng
        public function update() {
            $query = "UPDATE " . $this->table_name . "
                      SET word = :word, 
                          meaning = :meaning, 
                          audio = :audio, 
                          pronunciation = :pronunciation, 
                          example = :example, 
                          difficulty_level = :difficulty_level, 
                          word_type = :word_type
                      WHERE vocab_id = :vocab_id";
                          
            $stmt = $this->conn->prepare($query);
            
            // Làm sạch dữ liệu
            $this->vocab_id = htmlspecialchars(strip_tags($this->vocab_id));
            $this->word = htmlspecialchars(strip_tags($this->word));
            $this->meaning = htmlspecialchars(strip_tags($this->meaning));
            $this->audio = htmlspecialchars(strip_tags($this->audio));
            $this->pronunciation = htmlspecialchars(strip_tags($this->pronunciation));
            $this->example = htmlspecialchars(strip_tags($this->example));
            $this->difficulty_level = htmlspecialchars(strip_tags($this->difficulty_level));
            $this->word_type = htmlspecialchars(strip_tags($this->word_type));
            
            // Bind dữ liệu
            $stmt->bindParam(":vocab_id", $this->vocab_id);
            $stmt->bindParam(":word", $this->word);
            $stmt->bindParam(":meaning", $this->meaning);
            $stmt->bindParam(":audio", $this->audio);
            $stmt->bindParam(":pronunciation", $this->pronunciation);
            $stmt->bindParam(":example", $this->example);
            $stmt->bindParam(":difficulty_level", $this->difficulty_level);
            $stmt->bindParam(":word_type", $this->word_type);
            
            // Thực thi truy vấn
            if($stmt->execute()) {
                return true;
            }
            return false;
        }
        
        // Xóa từ vựng
        public function delete() {
            $query = "DELETE FROM " . $this->table_name . " WHERE vocab_id = :vocab_id";
            $stmt = $this->conn->prepare($query);
            
            $this->vocab_id = htmlspecialchars(strip_tags($this->vocab_id));
            $stmt->bindParam(":vocab_id", $this->vocab_id);
            
            if($stmt->execute()) {
                return true;
            }
            return false;
        }
        
        // Lấy từ vựng theo độ khó
        public function getByDifficulty($difficulty) {
            $query = "SELECT * FROM " . $this->table_name . " 
                      WHERE difficulty_level = :difficulty 
                      ORDER BY word";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":difficulty", $difficulty);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        // Lấy từ vựng theo loại từ
        public function getByWordType($word_type) {
            $query = "SELECT * FROM " . $this->table_name . " 
                      WHERE word_type = :word_type 
                      ORDER BY word";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":word_type", $word_type);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
?>