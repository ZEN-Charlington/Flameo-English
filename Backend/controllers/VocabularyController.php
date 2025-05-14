<?php
// controllers/VocabularyController.php
// Controller xử lý việc crawl từ vựng

    class VocabularyController {
        private $wordCrawler;
        
        public function __construct() {
            $this->wordCrawler = new WordCrawler();
        }
        
        // Crawl từ vựng
        public function crawlWords($limit = 3000) {
            return $this->wordCrawler->crawlAndSaveWords($limit);
        }
    }
?>