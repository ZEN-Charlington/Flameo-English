<?php
// backend/crawl_vocabulary.php

// Yêu cầu các file cần thiết
    require_once 'config/database.php';
    require_once 'models/Vocabulary.php';
    require_once 'services/WordCrawler.php';
    require_once 'controllers/VocabularyController.php';

    // Khởi tạo controller
    $controller = new VocabularyController();

    // Crawl 1000 từ vựng
    $count = $controller->crawlWords(1000);

    // In thông báo
    echo "Đã crawl {$count} từ vựng.\n";
?>