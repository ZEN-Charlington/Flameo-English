<?php
// rebuild_topiclessons.php
// Script để khôi phục lại bảng topiclessons sau khi bị truncate

require_once 'config/database.php';
require_once 'models/Topic.php';
require_once 'models/Lesson.php';
require_once 'models/TopicLesson.php';

class TopicLessonsRebuilder {
    private $conn;
    private $topicModel;
    private $lessonModel;
    private $topicLessonModel;
    
    // Cấu trúc chủ đề và các bài học tương ứng
    private $topicStructure = [
        // Word Types
        'Nouns' => [
            "Common Nouns in Daily Life",
            "Proper Nouns and Names",
            "Abstract Nouns and Concepts",
            "Collective Nouns for Groups",
            "Compound Nouns",
            "Countable and Uncountable Nouns",
            "Possessive Nouns",
            "Nouns as Subjects and Objects"
        ],
        'Verbs' => [
            "Action Verbs",
            "Linking Verbs",
            "Regular Verbs and Conjugation",
            "Irregular Verbs and Forms",
            "Phrasal Verbs in Conversation",
            "Modal Verbs and Their Uses",
            "Transitive and Intransitive Verbs",
            "Verb Tenses and Their Usage"
        ],
        'Adjectives' => [
            "Descriptive Adjectives",
            "Comparative and Superlative Forms",
            "Adjectives of Quality",
            "Adjectives of Quantity",
            "Adjectives of Size and Shape",
            "Adjectives of Age and Time",
            "Proper Adjectives",
            "Compound Adjectives"
        ],
        'Adverbs' => [
            "Adverbs of Manner",
            "Adverbs of Time",
            "Adverbs of Place",
            "Adverbs of Frequency",
            "Adverbs of Degree",
            "Comparative and Superlative Adverbs",
            "Adverbial Phrases",
            "Adverbs in Sentence Structure"
        ],
        'Determiners' => [
            "Basic Determiners",
            "Quantifier Determiners",
            "Demonstrative Determiners",
            "Possessive Determiners"
        ],
        'Pronouns' => [
            "Personal Pronouns",
            "Possessive Pronouns",
            "Reflexive Pronouns",
            "Relative Pronouns"
        ],
        'Conjunctions' => [
            "Coordinating Conjunctions",
            "Subordinating Conjunctions",
            "Correlative Conjunctions"
        ],
        'Prepositions' => [
            "Prepositions of Time",
            "Prepositions of Place",
            "Prepositions of Direction",
            "Prepositions of Manner"
        ],
        'Interjections' => [
            "Common Interjections",
            "Emotional Interjections"
        ],
        
        // Difficulty Levels
        'Beginner' => [
            "Basic Greetings and Introductions",
            "Numbers and Colors",
            "Family Members",
            "Daily Activities",
            "Food and Drinks",
            "Time and Date",
            "Weather and Seasons",
            "Basic Questions and Answers"
        ],
        'Intermediate' => [
            "Business Vocabulary",
            "Travel and Tourism",
            "Health and Medicine",
            "Technology Terms",
            "Environment and Nature",
            "Education and Learning",
            "Sports and Hobbies",
            "Shopping and Services"
        ],
        'Advanced' => [
            "Academic Writing and Research",
            "Literature and Literary Terms",
            "Scientific Terminology",
            "Legal Vocabulary",
            "Philosophy and Ethics",
            "Economics and Finance",
            "Politics and Government",
            "Art and Architecture"
        ],
        
        // Thematic Topics
        'Travel and Transportation' => [
            "Airport and Air Travel",
            "Train Stations and Rail Travel",
            "Buses and Public Transportation",
            "Cars and Driving",
            "Hotels and Accommodations",
            "Tourism and Sightseeing",
            "Travel Documents and Planning",
            "Directions and Navigation"
        ],
        'Food and Dining' => [
            "Fruits and Vegetables",
            "Meat, Fish, and Protein",
            "Beverages and Drinks",
            "Restaurant and Table Service",
            "Cooking Methods and Techniques",
            "Fast Food and Snacks",
            "Cuisines of the World",
            "Taste and Flavors"
        ],
        'Business and Work' => [
            "Office Vocabulary",
            "Job Titles and Roles",
            "Meetings and Presentations",
            "Business Communication",
            "Marketing and Sales",
            "Human Resources and Employment",
            "Finance and Accounting",
            "Entrepreneurship and Management"
        ],
        'Technology and Internet' => [
            "Computer Hardware",
            "Software and Applications",
            "Internet and Web",
            "Social Media",
            "Mobile Devices",
            "Programming and Development",
            "Cybersecurity",
            "Emerging Technologies"
        ],
        
        // Common English Words
        'Common English Words' => [
            "Basic Greetings and Introductions",
            "Family Members",
            "Numbers and Counting",
            "Colors",
            "Daily Activities",
            "Food and Drinks",
            "Time and Date",
            "Weather and Seasons"
        ]
    ];

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
        
        // Khởi tạo các model cần thiết
        $this->topicModel = new Topic($this->conn);
        $this->lessonModel = new Lesson($this->conn);
        $this->topicLessonModel = new TopicLesson($this->conn);
    }
    
    // Lấy ID của một chủ đề theo tên
    private function getTopicIdByName($topic_name) {
        $query = "SELECT topic_id FROM Topics WHERE topic_name = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $topic_name);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? $result['topic_id'] : false;
    }
    
    // Lấy ID của một bài học theo tiêu đề
    private function getLessonIdByTitle($title) {
        $query = "SELECT lesson_id FROM Lessons WHERE title = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $title);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ? $result['lesson_id'] : false;
    }
    
    // Kiểm tra xem bảng TopicLessons có trống không
    public function isTopicLessonsEmpty() {
        $query = "SELECT COUNT(*) as count FROM TopicLessons";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result['count'] == 0;
    }
    
    // Đếm số lượng chủ đề và bài học có sẵn
    public function countExistingData() {
        $counts = [];
        
        // Đếm số lượng chủ đề
        $query = "SELECT COUNT(*) as count FROM Topics";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $counts['topics'] = $result['count'];
        
        // Đếm số lượng bài học
        $query = "SELECT COUNT(*) as count FROM Lessons";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $counts['lessons'] = $result['count'];
        
        return $counts;
    }
    
    // Tạo lại liên kết giữa chủ đề và bài học
    public function rebuildTopicLessons() {
        // Kiểm tra xem bảng TopicLessons có trống không
        if (!$this->isTopicLessonsEmpty()) {
            echo "Bảng TopicLessons không trống. Bạn có muốn xóa sạch và tạo lại không? (y/n): ";
            $handle = fopen("php://stdin", "r");
            $line = trim(fgets($handle));
            fclose($handle);
            
            if (strtolower($line) != 'y') {
                echo "Hủy thao tác. Không thay đổi dữ liệu.\n";
                return false;
            }
            
            // Xóa sạch bảng TopicLessons
            $query = "TRUNCATE TABLE TopicLessons";
            $this->conn->exec($query);
            echo "Đã xóa sạch bảng TopicLessons để tạo lại.\n";
        }
        
        $totalLinked = 0;
        $errorCount = 0;
        $successCount = 0;
        
        // Duyệt qua cấu trúc chủ đề và liên kết với bài học
        foreach ($this->topicStructure as $topicName => $lessonTitles) {
            // Lấy ID của chủ đề
            $topicId = $this->getTopicIdByName($topicName);
            
            if (!$topicId) {
                echo "Không tìm thấy chủ đề '$topicName' trong cơ sở dữ liệu. Bỏ qua...\n";
                $errorCount++;
                continue;
            }
            
            // Duyệt qua các bài học thuộc chủ đề
            foreach ($lessonTitles as $index => $lessonTitle) {
                // Lấy ID của bài học
                $lessonId = $this->getLessonIdByTitle($lessonTitle);
                
                if (!$lessonId) {
                    echo "Không tìm thấy bài học '$lessonTitle' trong cơ sở dữ liệu. Bỏ qua...\n";
                    $errorCount++;
                    continue;
                }
                
                // Tạo và lưu liên kết mới
                $this->topicLessonModel->topic_id = $topicId;
                $this->topicLessonModel->lesson_id = $lessonId;
                $this->topicLessonModel->order_index = $index + 1; // Thứ tự bắt đầu từ 1
                
                if ($this->topicLessonModel->create()) {
                    $successCount++;
                    $totalLinked++;
                } else {
                    echo "Lỗi khi tạo liên kết giữa chủ đề '$topicName' và bài học '$lessonTitle'.\n";
                    $errorCount++;
                }
            }
            
            echo "Đã liên kết chủ đề '$topicName' với " . count($lessonTitles) . " bài học.\n";
        }
        
        echo "\n===== KẾT QUẢ TÁI TẠO TOPICLESSONS =====\n";
        echo "Tổng số liên kết đã tạo: $totalLinked\n";
        echo "Số liên kết thành công: $successCount\n";
        echo "Số liên kết thất bại: $errorCount\n";
        
        return $totalLinked > 0;
    }
    
    // Kiểm tra kết quả sau khi tái tạo
    public function verifyResults() {
        // Đếm số lượng liên kết trong TopicLessons
        $query = "SELECT COUNT(*) as count FROM TopicLessons";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $topicLessonCount = $result['count'];
        
        // Đếm số lượng chủ đề có liên kết
        $query = "SELECT COUNT(DISTINCT topic_id) as count FROM TopicLessons";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $linkedTopicCount = $result['count'];
        
        // Đếm số lượng bài học có liên kết
        $query = "SELECT COUNT(DISTINCT lesson_id) as count FROM TopicLessons";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $linkedLessonCount = $result['count'];
        
        // Đếm tổng số chủ đề và bài học
        $counts = $this->countExistingData();
        
        echo "\n===== KIỂM TRA KẾT QUẢ =====\n";
        echo "Tổng số liên kết trong TopicLessons: $topicLessonCount\n";
        echo "Số chủ đề có liên kết: $linkedTopicCount / {$counts['topics']}\n";
        echo "Số bài học có liên kết: $linkedLessonCount / {$counts['lessons']}\n";
        
        // Kiểm tra các chủ đề không có liên kết
        $query = "SELECT t.topic_id, t.topic_name FROM Topics t 
                  LEFT JOIN TopicLessons tl ON t.topic_id = tl.topic_id 
                  WHERE tl.topic_lesson_id IS NULL";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $unlinkedTopics = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($unlinkedTopics) > 0) {
            echo "\nCác chủ đề không có liên kết:\n";
            foreach ($unlinkedTopics as $topic) {
                echo "- {$topic['topic_name']} (ID: {$topic['topic_id']})\n";
            }
        }
        
        // Kiểm tra các bài học không có liên kết
        $query = "SELECT l.lesson_id, l.title FROM Lessons l 
                  LEFT JOIN TopicLessons tl ON l.lesson_id = tl.lesson_id 
                  WHERE tl.topic_lesson_id IS NULL";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $unlinkedLessons = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($unlinkedLessons) > 0) {
            echo "\nCác bài học không có liên kết:\n";
            foreach ($unlinkedLessons as $lesson) {
                echo "- {$lesson['title']} (ID: {$lesson['lesson_id']})\n";
            }
        }
        
        return $topicLessonCount > 0;
    }
    
    // Kiểm tra xem việc tái tạo có ảnh hưởng đến LessonVocabulary không
    public function checkLessonVocabularyIntegrity() {
        // Đếm số lượng liên kết trong LessonVocabulary
        $query = "SELECT COUNT(*) as count FROM LessonVocabulary";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $lessonVocabCount = $result['count'];
        
        echo "\n===== KIỂM TRA LESSONVOCABULARY =====\n";
        echo "Số lượng liên kết trong LessonVocabulary: $lessonVocabCount\n";
        
        // Kiểm tra các liên kết LessonVocabulary không hợp lệ (lesson_id không tồn tại)
        $query = "SELECT COUNT(*) as count FROM LessonVocabulary lv 
                  LEFT JOIN Lessons l ON lv.lesson_id = l.lesson_id 
                  WHERE l.lesson_id IS NULL";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $invalidLessonCount = $result['count'];
        
        if ($invalidLessonCount > 0) {
            echo "Cảnh báo: Có $invalidLessonCount liên kết trong LessonVocabulary trỏ đến bài học không tồn tại!\n";
        } else {
            echo "Tất cả liên kết trong LessonVocabulary đều hợp lệ.\n";
        }
        
        return $invalidLessonCount == 0;
    }
}

// Chạy chương trình
$rebuilder = new TopicLessonsRebuilder();

echo "===== TÁI TẠO BẢNG TOPICLESSONS =====\n";
echo "Chương trình này sẽ tái tạo lại các liên kết giữa chủ đề và bài học.\n";

// Kiểm tra dữ liệu hiện có
$counts = $rebuilder->countExistingData();
echo "\nDữ liệu hiện có:\n";
echo "- Số lượng chủ đề: {$counts['topics']}\n";
echo "- Số lượng bài học: {$counts['lessons']}\n";

// Xác nhận người dùng muốn tiếp tục
echo "\nBạn có muốn tiếp tục tái tạo TopicLessons không? (y/n): ";
$handle = fopen("php://stdin", "r");
$line = trim(fgets($handle));
fclose($handle);

if (strtolower($line) != 'y') {
    echo "Hủy thao tác. Không thay đổi dữ liệu.\n";
    exit;
}

// Tiến hành tái tạo
echo "\nĐang tái tạo liên kết TopicLessons...\n";
$result = $rebuilder->rebuildTopicLessons();

if ($result) {
    // Kiểm tra kết quả
    $rebuilder->verifyResults();
    
    // Kiểm tra tính toàn vẹn của LessonVocabulary
    $rebuilder->checkLessonVocabularyIntegrity();
    
    echo "\nHoàn tất tái tạo bảng TopicLessons!\n";
} else {
    echo "\nTái tạo bảng TopicLessons thất bại hoặc không có thay đổi.\n";
}
?>