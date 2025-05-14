<?php
    class WordCrawler {
        private $vocabulary;
        private $database;
        private $conn;
    
        public function __construct() {
            $this->database = new Database();
            $this->conn = $this->database->getConnection();
            $this->vocabulary = new Vocabulary($this->conn);
        }
    
        // Lấy danh sách từ để crawl
        public function getWordList($limit = 3000) {
            // Danh sách từ phổ biến từ GitHub
            $commonWords = file_get_contents('https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt');
            $words = explode("\n", $commonWords);
            
            // Lọc chỉ lấy những từ có độ dài >= 3 và <= 12
            $filteredWords = array_filter($words, function($word) {
                return strlen($word) >= 3 && strlen($word) <= 12;
            });
            
            // Lấy số lượng từ theo limit
            return array_slice($filteredWords, 0, $limit);
        }
    
        // Crawl từ vựng từ Free Dictionary API
        public function crawlFromFreeDictionary($word) {
            $url = "https://api.dictionaryapi.dev/api/v2/entries/en/" . urlencode($word);
            
            $curl = curl_init($url);
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
            $response = curl_exec($curl);
            curl_close($curl);
            
            $data = json_decode($response, true);
            
            if(!isset($data[0])) {
                return false;
            }
            
            $wordData = $data[0];
            
            // Lấy nghĩa, phát âm, loại từ và ví dụ từ API
            $english_meaning = "";
            $example = "";
            $word_type = "";
            $audio = "";
            $pronunciation = "";
            
            if(isset($wordData['phonetics']) && !empty($wordData['phonetics'])) {
                foreach($wordData['phonetics'] as $phonetic) {
                    if(isset($phonetic['audio']) && !empty($phonetic['audio'])) {
                        $audio = $phonetic['audio'];
                    }
                    if(isset($phonetic['text']) && !empty($phonetic['text'])) {
                        $pronunciation = $phonetic['text'];
                    }
                    if(!empty($audio) && !empty($pronunciation)) {
                        break;
                    }
                }
            }
            
            if(isset($wordData['meanings']) && !empty($wordData['meanings'])) {
                $word_type = $wordData['meanings'][0]['partOfSpeech'];
                
                if(isset($wordData['meanings'][0]['definitions']) && !empty($wordData['meanings'][0]['definitions'])) {
                    $english_meaning = $wordData['meanings'][0]['definitions'][0]['definition'];
                    
                    if(isset($wordData['meanings'][0]['definitions'][0]['example'])) {
                        $example = $wordData['meanings'][0]['definitions'][0]['example'];
                    }
                }
            }
            
            // Chỗ này để trống trường nghĩa tiếng Việt, người dùng sẽ tự điền sau
            $meaning = $english_meaning;
            
            // Đánh giá độ khó của từ dựa trên độ dài
            $difficulty_level = "Medium";
            if(strlen($word) <= 4) {
                $difficulty_level = "Easy";
            } else if(strlen($word) >= 8) {
                $difficulty_level = "Hard";
            }
            
            // Thiết lập dữ liệu cho từ vựng
            $this->vocabulary->word = $word;
            $this->vocabulary->meaning = $meaning;
            $this->vocabulary->audio = $audio;
            $this->vocabulary->pronunciation = $pronunciation;
            $this->vocabulary->example = $example;
            $this->vocabulary->difficulty_level = $difficulty_level;
            $this->vocabulary->word_type = $word_type;
            
            return true;
        }
    
        // Crawl và lưu từ vựng vào database
        public function crawlAndSaveWords($limit = 3000) {
            $words = $this->getWordList($limit);
            $count = 0;
            $failed = 0;
            $maxAttempts = 3;
            
            foreach($words as $word) {
                // Bỏ qua nếu từ đã tồn tại
                $this->vocabulary->word = $word;
                if($this->vocabulary->wordExists()) {
                    echo "Từ {$word} đã tồn tại, bỏ qua.\n";
                    continue;
                }
                
                // Crawl dữ liệu từ API
                $success = false;
                $attempts = 0;
                
                while(!$success && $attempts < $maxAttempts) {
                    $attempts++;
                    $success = $this->crawlFromFreeDictionary($word);
                    
                    if(!$success && $attempts < $maxAttempts) {
                        echo "Thử lại lần {$attempts} cho từ: {$word}\n";
                        sleep(2); // Chờ 2 giây trước khi thử lại
                    }
                }
                
                if($success) {
                    // Lưu từ vào database
                    if($this->vocabulary->create()) {
                        $count++;
                        echo "Đã thêm từ: {$word} - Nghĩa: {$this->vocabulary->meaning}\n";
                    } else {
                        $failed++;
                        echo "Lỗi khi thêm từ: {$word}\n";
                    }
                } else {
                    $failed++;
                    echo "Không tìm thấy dữ liệu cho từ: {$word} sau {$maxAttempts} lần thử\n";
                }
                
                // Ngừng khi đã lấy đủ số lượng từ
                if($count >= $limit) {
                    break;
                }
                
                // Tạm dừng để tránh quá tải API
                sleep(1);
            }
            
            echo "Hoàn thành! Đã thêm {$count} từ, thất bại {$failed} từ.\n";
            return $count;
        }
    }
?>