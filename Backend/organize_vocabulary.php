<?php
    require_once 'config/database.php';
    require_once 'models/Vocabulary.php';
    require_once 'models/Topic.php';
    require_once 'models/Lesson.php';
    require_once 'models/TopicLesson.php';
    require_once 'models/LessonVocabulary.php';
    require_once 'services/VocabularyOrganizer.php';
    
    // Kiểm tra xem đã có từ vựng chưa
    $database = new Database();
    $conn = $database->getConnection();
    
    $query = "SELECT COUNT(*) as count FROM Vocabulary";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if($result['count'] == 0) {
        echo "Không có từ vựng nào trong cơ sở dữ liệu. Vui lòng thêm từ vựng trước khi tổ chức.\n";
        exit;
    }
    
    echo "Bắt đầu tổ chức lại " . $result['count'] . " từ vựng trong các bài học...\n";
    
    // Khởi tạo VocabularyOrganizer
    $organizer = new VocabularyOrganizer();
    
    // Kiểm tra số lượng dữ liệu hiện tại
    $countTopic = "SELECT COUNT(*) as count FROM Topics";
    $countLesson = "SELECT COUNT(*) as count FROM Lessons";
    $countTopicLesson = "SELECT COUNT(*) as count FROM TopicLessons";
    $countLessonVocab = "SELECT COUNT(*) as count FROM LessonVocabulary";
    
    $stmt = $conn->prepare($countTopic);
    $stmt->execute();
    $topicCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    $stmt = $conn->prepare($countLesson);
    $stmt->execute();
    $lessonCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    $stmt = $conn->prepare($countTopicLesson);
    $stmt->execute();
    $topicLessonCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    $stmt = $conn->prepare($countLessonVocab);
    $stmt->execute();
    $oldLessonVocabCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    echo "\n===== THÔNG TIN HIỆN TẠI =====\n";
    echo "Số từ vựng trong database: {$result['count']}\n";
    echo "Số chủ đề hiện có: $topicCount\n";
    echo "Số bài học hiện có: $lessonCount\n";
    echo "Số liên kết chủ đề-bài học: $topicLessonCount\n";
    echo "Số liên kết bài học-từ vựng: $oldLessonVocabCount\n";
    
    // Hỏi người dùng có muốn xóa hết LessonVocabulary để tổ chức lại không
    echo "\nBạn có muốn xóa tất cả liên kết bài học-từ vựng hiện tại để tổ chức lại không? (y/n): ";
    $handle = fopen("php://stdin", "r");
    $line = trim(fgets($handle));
    
    if(strtolower($line) === 'y') {
        // Xóa hết dữ liệu trong bảng LessonVocabulary
        $conn->exec("DELETE FROM LessonVocabulary");
        echo "Đã xóa tất cả liên kết bài học-từ vựng cũ.\n";
    } else {
        echo "Bạn đã chọn giữ lại các liên kết hiện tại. Chúng sẽ được cập nhật thay vì tạo mới.\n";
    }
    
    // Hiển thị menu tùy chọn tổ chức lại
    echo "\n===== TÙY CHỌN TỔ CHỨC LẠI =====\n";
    echo "1. Tổ chức lại tất cả từ vựng\n";
    echo "2. Chỉ tổ chức lại từ vựng theo loại từ\n";
    echo "3. Chỉ tổ chức lại từ vựng theo độ khó\n";
    echo "4. Chỉ tổ chức lại từ vựng theo chủ đề thực tế\n";
    echo "5. Chỉ tổ chức lại từ vựng phổ biến\n";
    echo "Lựa chọn của bạn (1-5): ";
    
    $choice = trim(fgets($handle));
    
    switch($choice) {
        case '1':
            echo "\nĐang tổ chức lại tất cả từ vựng...\n";
            $organizer->reorganizeAllVocabulary();
            break;
        case '2':
            echo "\nĐang tổ chức lại từ vựng theo loại từ...\n";
            $organizer->reorganizeVocabularyByWordType();
            break;
        case '3':
            echo "\nĐang tổ chức lại từ vựng theo độ khó...\n";
            $organizer->reorganizeVocabularyByDifficulty();
            break;
        case '4':
            echo "\nĐang tổ chức lại từ vựng theo chủ đề thực tế...\n";
            $organizer->reorganizeVocabularyByThematic();
            break;
        case '5':
            echo "\nĐang tổ chức lại từ vựng phổ biến...\n";
            $organizer->reorganizeCommonVocabulary();
            break;
        default:
            echo "\nLựa chọn không hợp lệ. Mặc định sẽ tổ chức lại tất cả từ vựng.\n";
            $organizer->reorganizeAllVocabulary();
    }
    
    // Kiểm tra từ vựng chưa được gán
    echo "\nKiểm tra và gán từ vựng chưa được sử dụng...\n";
    $query = "SELECT COUNT(*) as count FROM Vocabulary v 
              LEFT JOIN LessonVocabulary lv ON v.vocab_id = lv.vocab_id 
              WHERE lv.lesson_vocab_id IS NULL";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $unusedCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    if($unusedCount > 0) {
        echo "Còn $unusedCount từ vựng chưa được gán vào bài học nào. Đang gán...\n";
        
        // Gọi phương thức để gán từ vựng còn lại
        $organizer->assignRemainingVocabulary();
    } else {
        echo "Tất cả từ vựng đã được gán vào các bài học phù hợp.\n";
    }
    
    // Kiểm tra lại số lượng liên kết
    $stmt = $conn->prepare($countLessonVocab);
    $stmt->execute();
    $newLessonVocabCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    echo "\n===== KẾT QUẢ TỔ CHỨC LẠI TỪ VỰNG =====\n";
    echo "Số liên kết bài học-từ vựng trước khi tổ chức lại: $oldLessonVocabCount\n";
    echo "Số liên kết bài học-từ vựng sau khi tổ chức lại: $newLessonVocabCount\n";
    
    // Kiểm tra lại còn từ vựng nào chưa được gán không
    $query = "SELECT COUNT(*) as count FROM Vocabulary v 
              LEFT JOIN LessonVocabulary lv ON v.vocab_id = lv.vocab_id 
              WHERE lv.lesson_vocab_id IS NULL";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $unusedCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    if($unusedCount > 0) {
        echo "Vẫn còn $unusedCount từ vựng chưa được gán vào bài học nào.\n";
    } else {
        echo "Tất cả từ vựng đã được gán vào các bài học phù hợp.\n";
    }
    
    // Hiển thị thêm thống kê
    $query = "SELECT DISTINCT vocab_id FROM LessonVocabulary";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $uniqueVocabsCount = $stmt->rowCount();
    
    echo "Tổng số từ vựng đã được gán: $uniqueVocabsCount / {$result['count']}\n";
    
    // Thống kê theo từ loại
    $query = "SELECT v.word_type, COUNT(DISTINCT v.vocab_id) as count 
              FROM Vocabulary v 
              JOIN LessonVocabulary lv ON v.vocab_id = lv.vocab_id 
              GROUP BY v.word_type 
              ORDER BY count DESC";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $wordTypeStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\nPhân bố từ vựng theo loại từ:\n";
    foreach ($wordTypeStats as $stat) {
        $type = $stat['word_type'] ? $stat['word_type'] : 'unknown';
        echo "- $type: {$stat['count']} từ\n";
    }
    
    echo "\nĐã hoàn tất việc tổ chức lại từ vựng!\n";
    fclose($handle);
?>