<?php
// services/VocabularyOrganizer.php

class VocabularyOrganizer {
    private $conn;
    private $topic;
    private $lesson;
    private $topicLesson;
    private $lessonVocabulary;
    
    // Các chủ đề và từ vựng tương ứng
    private $thematicMapping = [
        // Travel and Transportation
        'Travel and Transportation' => [
            'Airport and Air Travel' => ['airport', 'flight', 'baggage', 'passport', 'boarding', 'terminal', 'airline', 'jet', 'runway', 'departure', 'arrival', 'check-in', 'security', 'customs', 'pilot'],
            'Train Stations and Rail Travel' => ['train', 'station', 'track', 'ticket', 'rail', 'platform', 'carriage', 'passenger', 'conductor', 'departure', 'arrival', 'schedule', 'express', 'journey', 'railway'],
            'Buses and Public Transportation' => ['bus', 'stop', 'route', 'fare', 'metro', 'subway', 'tram', 'commute', 'passenger', 'schedule', 'driver', 'transfer', 'card', 'timetable', 'destination'],
            'Cars and Driving' => ['car', 'drive', 'road', 'highway', 'license', 'wheel', 'fuel', 'traffic', 'vehicle', 'parking', 'brake', 'engine', 'passenger', 'seat', 'driver'],
            'Hotels and Accommodations' => ['hotel', 'room', 'booking', 'reservation', 'check-in', 'reception', 'suite', 'accommodation', 'amenity', 'guest', 'key', 'service', 'staff', 'stay', 'hostel'],
            'Tourism and Sightseeing' => ['tour', 'tourist', 'guide', 'attraction', 'sightseeing', 'landmark', 'monument', 'souvenir', 'travel', 'excursion', 'trip', 'vacation', 'destination', 'visit', 'explore'],
            'Travel Documents and Planning' => ['passport', 'visa', 'booking', 'itinerary', 'reservation', 'insurance', 'document', 'plan', 'checklist', 'guide', 'map', 'confirmation', 'identity', 'ticket', 'schedule'],
            'Directions and Navigation' => ['direction', 'map', 'navigation', 'route', 'location', 'compass', 'gps', 'destination', 'distance', 'guide', 'landmark', 'address', 'path', 'orientation', 'street']
        ],
        
        // Food and Dining
        'Food and Dining' => [
            'Fruits and Vegetables' => ['apple', 'banana', 'orange', 'vegetable', 'carrot', 'potato', 'tomato', 'fruit', 'grape', 'berry', 'lemon', 'cucumber', 'onion', 'pepper', 'salad'],
            'Meat, Fish, and Protein' => ['meat', 'beef', 'chicken', 'pork', 'fish', 'seafood', 'protein', 'lamb', 'steak', 'bacon', 'sausage', 'shrimp', 'egg', 'turkey', 'tofu'],
            'Beverages and Drinks' => ['water', 'coffee', 'tea', 'juice', 'soda', 'drink', 'milk', 'beer', 'wine', 'cocktail', 'beverage', 'alcohol', 'bottle', 'cup', 'glass'],
            'Restaurant and Table Service' => ['restaurant', 'menu', 'waiter', 'order', 'table', 'bill', 'reservation', 'service', 'tip', 'chef', 'dish', 'dining', 'meal', 'dinner', 'lunch'],
            'Cooking Methods and Techniques' => ['cook', 'bake', 'fry', 'boil', 'grill', 'recipe', 'roast', 'simmer', 'chop', 'slice', 'mix', 'prepare', 'stir', 'heat', 'technique'],
            'Fast Food and Snacks' => ['fast', 'pizza', 'burger', 'fries', 'sandwich', 'snack', 'chips', 'hotdog', 'takeaway', 'delivery', 'quick', 'convenience', 'junk', 'wrap', 'nugget'],
            'Cuisines of the World' => ['cuisine', 'italian', 'chinese', 'mexican', 'indian', 'japanese', 'french', 'traditional', 'ethnic', 'international', 'spice', 'flavor', 'style', 'dish', 'specialty'],
            'Taste and Flavors' => ['taste', 'flavor', 'sweet', 'sour', 'bitter', 'spicy', 'salty', 'savory', 'delicious', 'bland', 'rich', 'creamy', 'fresh', 'aromatic', 'seasoning']
        ],
        
        // Business and Work
        'Business and Work' => [
            'Office Vocabulary' => ['office', 'desk', 'computer', 'meeting', 'chair', 'colleague', 'printer', 'document', 'folder', 'workstation', 'cubicle', 'stationery', 'telephone', 'schedule', 'workspace'],
            'Job Titles and Roles' => ['manager', 'supervisor', 'assistant', 'director', 'officer', 'executive', 'clerk', 'specialist', 'associate', 'president', 'coordinator', 'analyst', 'administrator', 'consultant', 'representative'],
            'Meetings and Presentations' => ['meeting', 'presentation', 'conference', 'agenda', 'participant', 'minute', 'slide', 'discussion', 'report', 'schedule', 'briefing', 'seminar', 'audience', 'speaker', 'projector'],
            'Business Communication' => ['email', 'message', 'call', 'communication', 'memo', 'report', 'newsletter', 'correspondence', 'announcement', 'letter', 'contact', 'briefing', 'feedback', 'notification', 'proposal'],
            'Marketing and Sales' => ['marketing', 'sales', 'customer', 'product', 'brand', 'market', 'promotion', 'advertising', 'client', 'target', 'campaign', 'strategy', 'retail', 'consumer', 'commerce'],
            'Human Resources and Employment' => ['employee', 'recruitment', 'interview', 'resume', 'career', 'training', 'salary', 'benefit', 'personnel', 'hiring', 'staff', 'candidate', 'position', 'application', 'workforce'],
            'Finance and Accounting' => ['finance', 'accounting', 'budget', 'expense', 'revenue', 'investment', 'cost', 'tax', 'profit', 'asset', 'liability', 'audit', 'balance', 'fund', 'transaction'],
            'Entrepreneurship and Management' => ['business', 'management', 'strategy', 'leadership', 'entrepreneur', 'startup', 'innovation', 'vision', 'mission', 'goal', 'objective', 'growth', 'development', 'performance', 'success']
        ],
        
        // Technology and Internet
        'Technology and Internet' => [
            'Computer Hardware' => ['computer', 'hardware', 'keyboard', 'mouse', 'monitor', 'printer', 'device', 'processor', 'memory', 'drive', 'storage', 'server', 'component', 'cable', 'peripheral'],
            'Software and Applications' => ['software', 'application', 'program', 'system', 'app', 'update', 'version', 'feature', 'interface', 'tool', 'function', 'compatible', 'install', 'download', 'developer'],
            'Internet and Web' => ['internet', 'website', 'browser', 'search', 'online', 'web', 'network', 'connection', 'wifi', 'domain', 'link', 'page', 'email', 'upload', 'download'],
            'Social Media' => ['social', 'media', 'profile', 'post', 'share', 'follow', 'like', 'comment', 'platform', 'content', 'update', 'network', 'message', 'notification', 'friend'],
            'Mobile Devices' => ['mobile', 'phone', 'smartphone', 'tablet', 'device', 'app', 'screen', 'touchscreen', 'camera', 'battery', 'charger', 'wireless', 'portable', 'cellular', 'data'],
            'Programming and Development' => ['programming', 'development', 'code', 'developer', 'software', 'language', 'application', 'design', 'test', 'debug', 'algorithm', 'function', 'database', 'system', 'interface'],
            'Cybersecurity' => ['security', 'password', 'protection', 'privacy', 'encryption', 'hacker', 'firewall', 'virus', 'malware', 'authentication', 'threat', 'breach', 'secure', 'data', 'risk'],
            'Emerging Technologies' => ['technology', 'innovation', 'artificial', 'intelligence', 'virtual', 'reality', 'robot', 'automation', 'digital', 'smart', 'future', 'development', 'advanced', 'revolutionary', 'cutting-edge']
        ]
    ];
    
    // Chi tiết cho các loại từ
    private $wordTypeKeywords = [
        'noun' => [
            "Common Nouns in Daily Life" => ["common", "daily", "life", "house", "food", "car", "phone", "book", "friend", "work"],
            "Proper Nouns and Names" => ["proper", "name", "country", "city", "person", "company", "brand", "organization", "place", "title"],
            "Abstract Nouns and Concepts" => ["abstract", "concept", "idea", "love", "freedom", "peace", "happiness", "knowledge", "thought", "beauty"],
            "Collective Nouns for Groups" => ["collective", "group", "team", "family", "crowd", "class", "committee", "army", "flock", "herd"],
            "Compound Nouns" => ["compound", "bedroom", "football", "sunshine", "rainbow", "classroom", "notebook", "airport", "moonlight", "breakfast"],
            "Countable and Uncountable Nouns" => ["countable", "uncountable", "water", "money", "information", "furniture", "advice", "rice", "coffee", "bread"],
            "Possessive Nouns" => ["possessive", "owner", "belonging", "property", "ownership", "possession", "estate", "asset", "wealth", "heritage"],
            "Nouns as Subjects and Objects" => ["subject", "object", "sentence", "grammar", "structure", "function", "position", "clause", "predicate", "passive"]
        ],
        'verb' => [
            "Action Verbs" => ["action", "run", "jump", "eat", "walk", "play", "write", "read", "swim", "dance"],
            "Linking Verbs" => ["linking", "be", "seem", "appear", "become", "feel", "look", "smell", "sound", "taste"],
            "Regular Verbs and Conjugation" => ["regular", "conjugation", "base", "present", "past", "future", "form", "pattern", "tense", "ending"],
            "Irregular Verbs and Forms" => ["irregular", "go", "see", "come", "know", "give", "take", "bring", "think", "speak"],
            "Phrasal Verbs in Conversation" => ["phrasal", "look up", "turn on", "get over", "break down", "put off", "give up", "come back", "go away", "pick up"],
            "Modal Verbs and Their Uses" => ["modal", "can", "could", "may", "might", "must", "should", "would", "shall", "will"],
            "Transitive and Intransitive Verbs" => ["transitive", "intransitive", "direct", "object", "require", "follow", "complement", "passive", "active", "construction"],
            "Verb Tenses and Their Usage" => ["tense", "present", "past", "future", "continuous", "perfect", "simple", "progressive", "conditional", "participle"]
        ],
        'adjective' => [
            "Descriptive Adjectives" => ["descriptive", "beautiful", "good", "bad", "happy", "sad", "interesting", "boring", "delicious", "terrible"],
            "Comparative and Superlative Forms" => ["comparative", "superlative", "bigger", "better", "more", "most", "less", "least", "than", "comparison"],
            "Adjectives of Quality" => ["quality", "excellent", "poor", "fine", "superior", "inferior", "perfect", "mediocre", "outstanding", "superb"],
            "Adjectives of Quantity" => ["quantity", "many", "much", "few", "little", "some", "any", "no", "enough", "several"],
            "Adjectives of Size and Shape" => ["size", "shape", "big", "small", "large", "tiny", "round", "square", "thin", "thick"],
            "Adjectives of Age and Time" => ["age", "time", "young", "old", "new", "ancient", "modern", "recent", "early", "late"],
            "Proper Adjectives" => ["proper", "american", "chinese", "british", "french", "mexican", "canadian", "italian", "spanish", "australian"],
            "Compound Adjectives" => ["compound", "well-known", "good-looking", "high-quality", "long-term", "last-minute", "far-reaching", "self-confident", "ice-cold", "world-famous"]
        ],
        'adverb' => [
            "Adverbs of Manner" => ["manner", "quickly", "slowly", "carefully", "easily", "well", "badly", "beautifully", "quietly", "loudly"],
            "Adverbs of Time" => ["time", "now", "then", "today", "tomorrow", "yesterday", "soon", "later", "early", "late"],
            "Adverbs of Place" => ["place", "here", "there", "everywhere", "anywhere", "nowhere", "inside", "outside", "upstairs", "downstairs"],
            "Adverbs of Frequency" => ["frequency", "always", "usually", "often", "sometimes", "rarely", "never", "frequently", "occasionally", "seldom"],
            "Adverbs of Degree" => ["degree", "very", "quite", "rather", "too", "enough", "extremely", "fairly", "slightly", "almost"],
            "Comparative and Superlative Adverbs" => ["comparative", "superlative", "more", "most", "better", "best", "worse", "worst", "less", "least"],
            "Adverbial Phrases" => ["phrase", "at once", "in general", "by chance", "on purpose", "in brief", "without doubt", "of course", "in time", "at least"],
            "Adverbs in Sentence Structure" => ["sentence", "structure", "position", "beginning", "end", "clause", "modify", "emphasize", "connect", "transition"]
        ],
        'determiner' => [
            "Basic Determiners" => ["the", "a", "an", "this", "that", "these", "those", "my", "your", "his"],
            "Quantifier Determiners" => ["all", "many", "much", "few", "little", "some", "any", "enough", "several", "most"],
            "Demonstrative Determiners" => ["this", "that", "these", "those", "such", "former", "latter", "same", "other", "another"],
            "Possessive Determiners" => ["my", "your", "his", "her", "its", "our", "their", "whose", "one's", "own"]
        ],
        'pronoun' => [
            "Personal Pronouns" => ["i", "you", "he", "she", "it", "we", "they", "me", "him", "her"],
            "Possessive Pronouns" => ["mine", "yours", "his", "hers", "its", "ours", "theirs", "whose", "one's", "own"],
            "Reflexive Pronouns" => ["myself", "yourself", "himself", "herself", "itself", "ourselves", "yourselves", "themselves", "oneself", "thyself"],
            "Relative Pronouns" => ["who", "whom", "whose", "which", "that", "what", "whoever", "whomever", "whatever", "whichever"]
        ],
        'conjunction' => [
            "Coordinating Conjunctions" => ["and", "but", "or", "nor", "for", "yet", "so", "then", "still", "however"],
            "Subordinating Conjunctions" => ["if", "when", "because", "although", "while", "until", "unless", "since", "before", "after"],
            "Correlative Conjunctions" => ["both", "either", "neither", "whether", "not only", "but also", "as", "just as", "the more", "the less"]
        ],
        'preposition' => [
            "Prepositions of Time" => ["at", "in", "on", "during", "before", "after", "until", "since", "for", "by"],
            "Prepositions of Place" => ["in", "on", "at", "under", "over", "above", "below", "between", "among", "beside"],
            "Prepositions of Direction" => ["to", "from", "toward", "away", "into", "out", "up", "down", "along", "across"],
            "Prepositions of Manner" => ["by", "with", "without", "like", "as", "through", "via", "in", "on", "upon"]
        ],
        'interjection' => [
            "Common Interjections" => ["oh", "wow", "hi", "hello", "hey", "ouch", "oops", "ah", "well", "hmm"],
            "Emotional Interjections" => ["hooray", "hurrah", "yay", "woo", "alas", "ugh", "eww", "phew", "whew", "yikes"]
        ]
    ];
    
    // Các từ vựng phổ biến hàng ngày
    private $commonVocabulary = [
        "Basic Greetings and Introductions" => ["hello", "hi", "hey", "good", "morning", "afternoon", "evening", "night", "welcome", "goodbye", "bye", "name", "nice", "meet", "pleased"],
        "Family Members" => ["family", "father", "mother", "dad", "mom", "parent", "son", "daughter", "brother", "sister", "uncle", "aunt", "grandparent", "grandfather", "grandmother"],
        "Numbers and Counting" => ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "hundred", "thousand", "first", "second", "third"],
        "Colors" => ["color", "red", "blue", "green", "yellow", "black", "white", "brown", "orange", "purple", "pink", "gray", "silver", "gold", "bronze"],
        "Daily Activities" => ["wake", "sleep", "eat", "drink", "work", "play", "study", "read", "write", "watch", "listen", "speak", "talk", "walk", "run"],
        "Food and Drinks" => ["food", "breakfast", "lunch", "dinner", "meal", "fruit", "vegetable", "meat", "fish", "bread", "rice", "water", "milk", "juice", "coffee"],
        "Time and Date" => ["time", "hour", "minute", "second", "day", "week", "month", "year", "today", "tomorrow", "yesterday", "morning", "afternoon", "evening", "night"],
        "Weather and Seasons" => ["weather", "season", "spring", "summer", "autumn", "fall", "winter", "hot", "cold", "warm", "cool", "rain", "snow", "sun", "wind"]
    ];
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
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

    // Lấy danh sách bài học từ một chủ đề
    private function getLessonsByTopic($topic_id) {
        $query = "SELECT l.lesson_id, l.title 
                FROM Lessons l 
                JOIN TopicLessons tl ON l.lesson_id = tl.lesson_id 
                WHERE tl.topic_id = ?
                ORDER BY l.display_order";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $topic_id);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Xóa tất cả từ vựng từ một bài học
    private function clearLessonVocabulary($lesson_id) {
        $query = "DELETE FROM LessonVocabulary WHERE lesson_id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $lesson_id);
        return $stmt->execute();
    }

    // Lấy danh sách từ vựng theo độ khó
    public function getVocabsByDifficulty($difficulty_level, $limit = 100, $offset = 0) {
        $query = "SELECT vocab_id, word, meaning, word_type FROM Vocabulary 
                WHERE difficulty_level = ? 
                ORDER BY word 
                LIMIT ?, ?";
                
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(1, $difficulty_level);
        $stmt->bindParam(2, $offset, PDO::PARAM_INT);
        $stmt->bindParam(3, $limit, PDO::PARAM_INT);
        
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Lấy danh sách từ vựng theo loại từ
    public function getVocabsByWordType($word_type, $limit = 100, $offset = 0) {
        $query = "SELECT vocab_id, word, meaning, difficulty_level FROM Vocabulary 
                WHERE word_type = ? 
                ORDER BY word 
                LIMIT ?, ?";
                
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(1, $word_type);
        $stmt->bindParam(2, $offset, PDO::PARAM_INT);
        $stmt->bindParam(3, $limit, PDO::PARAM_INT);
        
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Tìm từ vựng bởi từ khóa - phiên bản cải tiến
    public function findVocabsByKeywords($keywords) {
        // Phương thức tìm kiếm chính
        $query = "SELECT vocab_id, word, meaning, word_type, difficulty_level FROM Vocabulary 
                WHERE LOWER(word) LIKE ? OR LOWER(meaning) LIKE ?
                ORDER BY word
                LIMIT 50";
        
        $results = [];
        
        // Tìm theo từng từ khóa
        foreach ($keywords as $keyword) {
            $search_term = "%" . strtolower($keyword) . "%";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(1, $search_term);
            $stmt->bindParam(2, $search_term);
            $stmt->execute();
            
            $found_vocabs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Thêm vào kết quả nếu chưa có
            foreach ($found_vocabs as $vocab) {
                $exists = false;
                foreach ($results as $existing) {
                    if ($existing['vocab_id'] == $vocab['vocab_id']) {
                        $exists = true;
                        break;
                    }
                }
                
                if (!$exists) {
                    $results[] = $vocab;
                }
            }
            
            // Nếu đã tìm được đủ từ, dừng tìm kiếm
            if (count($results) >= 15) {
                break;
            }
        }
        
        // Nếu không tìm thấy đủ từ vựng với từ khóa, tìm kiếm dự phòng
        if (count($results) < 5) {
            // Tìm kiếm dự phòng - lấy ngẫu nhiên
            $backup_query = "SELECT vocab_id, word, meaning, word_type, difficulty_level FROM Vocabulary 
                            ORDER BY RAND() 
                            LIMIT ?";
            $stmt = $this->conn->prepare($backup_query);
            $limit = 15 - count($results);
            $stmt->bindParam(1, $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            $backup_vocabs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Thêm vào kết quả nếu chưa có
            foreach ($backup_vocabs as $vocab) {
                $exists = false;
                foreach ($results as $existing) {
                    if ($existing['vocab_id'] == $vocab['vocab_id']) {
                        $exists = true;
                        break;
                    }
                }
                
                if (!$exists) {
                    $results[] = $vocab;
                }
            }
        }
        
        return $results;
    }

    // Liên kết từ vựng với bài học - phiên bản sửa lỗi
    public function linkVocabToLesson($lesson_id, $vocab_id, $display_order = 0, $custom_meaning = NULL, $custom_example = NULL) {
        // Kiểm tra xem từ vựng có tồn tại không
        $check_vocab_query = "SELECT vocab_id FROM Vocabulary WHERE vocab_id = ?";
        $check_vocab_stmt = $this->conn->prepare($check_vocab_query);
        $check_vocab_stmt->bindParam(1, $vocab_id);
        $check_vocab_stmt->execute();
        
        if ($check_vocab_stmt->rowCount() == 0) {
            // Từ vựng không tồn tại
            return false;
        }
        
        // Kiểm tra xem đã tồn tại liên kết chưa
        $check_query = "SELECT lesson_vocab_id FROM LessonVocabulary WHERE lesson_id = ? AND vocab_id = ?";
        $check_stmt = $this->conn->prepare($check_query);
        $check_stmt->bindParam(1, $lesson_id);
        $check_stmt->bindParam(2, $vocab_id);
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() > 0) {
            // Nếu đã tồn tại, cập nhật
            $update_query = "UPDATE LessonVocabulary SET display_order = ?, custom_meaning = ?, custom_example = ? 
                            WHERE lesson_id = ? AND vocab_id = ?";
            $stmt = $this->conn->prepare($update_query);
            $stmt->bindParam(1, $display_order);
            $stmt->bindParam(2, $custom_meaning);
            $stmt->bindParam(3, $custom_example);
            $stmt->bindParam(4, $lesson_id);
            $stmt->bindParam(5, $vocab_id);
        } else {
            // Nếu chưa tồn tại, thêm mới
            $insert_query = "INSERT INTO LessonVocabulary (lesson_id, vocab_id, display_order, custom_meaning, custom_example) 
                            VALUES (?, ?, ?, ?, ?)";
            $stmt = $this->conn->prepare($insert_query);
            $stmt->bindParam(1, $lesson_id);
            $stmt->bindParam(2, $vocab_id);
            $stmt->bindParam(3, $display_order);
            $stmt->bindParam(4, $custom_meaning);
            $stmt->bindParam(5, $custom_example);
        }
        
        return $stmt->execute();
    }

    // Tổ chức lại từ vựng trong bài học theo từ loại
    public function reorganizeVocabularyByWordType() {
        // Lấy tất cả từ vựng và từ loại từ database
        $query = "SELECT vocab_id, word, word_type FROM Vocabulary ORDER BY word";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $all_vocabs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Phân loại từ vựng theo từ loại
        $vocabs_by_type = [];
        foreach ($all_vocabs as $vocab) {
            $word_type = $vocab['word_type'] ? $vocab['word_type'] : 'unknown';
            if (!isset($vocabs_by_type[$word_type])) {
                $vocabs_by_type[$word_type] = [];
            }
            $vocabs_by_type[$word_type][] = $vocab;
        }
        
        // Xử lý từng loại từ
        $word_types = ['noun', 'verb', 'adjective', 'adverb', 'determiner', 'pronoun', 'conjunction', 'preposition', 'interjection'];
        foreach ($word_types as $word_type) {
            if (!isset($vocabs_by_type[$word_type]) || empty($vocabs_by_type[$word_type])) {
                continue; // Bỏ qua nếu không có từ nào thuộc loại này
            }
            
            // Lấy ID chủ đề của loại từ này
            $topic_name = ucfirst($word_type) . 's'; // Chuyển thành số nhiều, ví dụ: "Nouns", "Verbs"...
            $topic_id = $this->getTopicIdByName($topic_name);
            
            if (!$topic_id) {
                echo "Không tìm thấy chủ đề cho {$word_type}. Bỏ qua...\n";
                continue;
            }
            
            // Lấy danh sách bài học thuộc chủ đề này
            $lessons = $this->getLessonsByTopic($topic_id);
            
            if (empty($lessons)) {
                echo "Không tìm thấy bài học nào cho chủ đề {$topic_name}. Bỏ qua...\n";
                continue;
            }
            
            // Lấy danh sách các từ khóa cho loại từ này
            $type_keywords = isset($this->wordTypeKeywords[$word_type]) ? $this->wordTypeKeywords[$word_type] : [];
            
            // Xóa từ vựng cũ và phân phối lại
            foreach ($lessons as $index => $lesson) {
                // Xóa tất cả từ vựng hiện tại của bài học
                $this->clearLessonVocabulary($lesson['lesson_id']);
                
                // Tìm từ vựng phù hợp dựa trên từ khóa 
                $vocabs_to_add = [];
                if (isset($type_keywords[$lesson['title']])) {
                    $keywords = $type_keywords[$lesson['title']];
                    $found_vocabs = $this->findVocabsByKeywords($keywords);
                    
                    // Lọc chỉ lấy từ vựng thuộc loại từ này
                    foreach ($found_vocabs as $found_vocab) {
                        if ($found_vocab['word_type'] == $word_type) {
                            $vocabs_to_add[] = $found_vocab;
                        }
                    }
                }
                
                // Nếu không đủ từ, lấy thêm từ danh sách tổng hợp
                if (count($vocabs_to_add) < 15) {
                    // Tính số lượng từ còn cần
                    $needed_count = 15 - count($vocabs_to_add);
                    $offset = $index * 15; // Offset để lấy các từ khác nhau cho mỗi bài học
                    
                    // Lấy danh sách từ vựng từ loại đang xét
                    $remaining_vocabs = $this->getVocabsByWordType($word_type, $needed_count * 2, $offset);
                    
                    // Lọc để chỉ lấy những từ chưa có trong vocabs_to_add
                    foreach ($remaining_vocabs as $vocab) {
                        $exists = false;
                        foreach ($vocabs_to_add as $existing) {
                            if ($existing['vocab_id'] == $vocab['vocab_id']) {
                                $exists = true;
                                break;
                            }
                        }
                        
                        if (!$exists && count($vocabs_to_add) < 15) {
                            $vocabs_to_add[] = $vocab;
                        }
                        
                        if (count($vocabs_to_add) >= 15) {
                            break;
                        }
                    }
                }
                
                // Thêm từ vựng vào bài học
                $display_order = 1;
                foreach ($vocabs_to_add as $vocab) {
                    $this->linkVocabToLesson($lesson['lesson_id'], $vocab['vocab_id'], $display_order);
                    $display_order++;
                }
                
                echo "Đã thêm " . count($vocabs_to_add) . " từ vựng vào bài học {$lesson['title']}.\n";
            }
        }
        
        echo "Đã tổ chức lại từ vựng theo loại từ!\n";
        return true;
    }

    // Tổ chức lại từ vựng trong bài học theo độ khó
    public function reorganizeVocabularyByDifficulty() {
        // Các chủ đề dựa trên độ khó
        $difficulty_topics = [
            "Beginner" => "Easy",
            "Intermediate" => "Medium",
            "Advanced" => "Hard"
        ];
        
        // Từ khóa cho các bài học beginner
        $beginner_keywords = [
            "Basic Greetings and Introductions" => ["hello", "hi", "greeting", "introduction", "name", "meet", "nice", "welcome", "goodbye", "bye"],
            "Numbers and Colors" => ["number", "one", "two", "three", "count", "color", "red", "blue", "green", "yellow"],
            "Family Members" => ["family", "mother", "father", "sister", "brother", "son", "daughter", "parent", "child", "relative"],
            "Daily Activities" => ["daily", "activity", "wake", "sleep", "eat", "work", "study", "walk", "run", "read"],
            "Food and Drinks" => ["food", "eat", "drink", "meal", "breakfast", "lunch", "dinner", "fruit", "vegetable", "water"],
            "Time and Date" => ["time", "hour", "minute", "second", "day", "week", "month", "year", "clock", "calendar"],
            "Weather and Seasons" => ["weather", "rain", "snow", "sun", "wind", "hot", "cold", "season", "winter", "summer"],
            "Basic Questions and Answers" => ["question", "answer", "what", "where", "when", "who", "why", "how", "yes", "no"]
        ];

        // Từ khóa cho bài học intermediate
        $intermediate_keywords = [
            "Business Vocabulary" => ["business", "company", "office", "manager", "meeting", "report", "project", "market", "client", "colleague"],
            "Travel and Tourism" => ["travel", "tourism", "hotel", "flight", "ticket", "vacation", "destination", "guide", "passport", "tourist"],
            "Health and Medicine" => ["health", "medicine", "doctor", "hospital", "patient", "disease", "treatment", "symptom", "nurse", "clinic"],
            "Technology Terms" => ["technology", "computer", "internet", "software", "device", "digital", "online", "data", "program", "system"],
            "Environment and Nature" => ["environment", "nature", "pollution", "climate", "animal", "plant", "forest", "river", "mountain", "conservation"],
            "Education and Learning" => ["education", "school", "university", "student", "teacher", "course", "learn", "knowledge", "study", "degree"],
            "Sports and Hobbies" => ["sport", "hobby", "game", "play", "team", "win", "competition", "exercise", "athlete", "leisure"],
            "Shopping and Services" => ["shopping", "store", "market", "buy", "sell", "price", "product", "service", "customer", "retail"]
        ];

        // Từ khóa cho bài học advanced
        $advanced_keywords = [
            "Academic Writing and Research" => ["academic", "research", "thesis", "dissertation", "methodology", "analysis", "theory", "citation", "publication", "scholar"],
            "Literature and Literary Terms" => ["literature", "novel", "poetry", "author", "character", "plot", "theme", "genre", "narrative", "metaphor"],
            "Scientific Terminology" => ["science", "scientific", "experiment", "hypothesis", "theory", "research", "laboratory", "observation", "data", "analysis"],
            "Legal Vocabulary" => ["legal", "law", "court", "judge", "attorney", "justice", "plaintiff", "defendant", "legislation", "regulation"],
            "Philosophy and Ethics" => ["philosophy", "ethics", "moral", "concept", "logic", "existence", "consciousness", "theory", "principle", "rational"],
            "Economics and Finance" => ["economics", "finance", "economy", "market", "investment", "capital", "budget", "inflation", "currency", "fiscal"],
            "Politics and Government" => ["politics", "government", "policy", "election", "democracy", "parliament", "constitution", "diplomacy", "legislation", "congress"],
            "Art and Architecture" => ["art", "architecture", "design", "aesthetic", "sculpture", "painting", "exhibition", "gallery", "artist", "creativity"]
        ];
        
        $keywords_map = [
            "Beginner" => $beginner_keywords,
            "Intermediate" => $intermediate_keywords,
            "Advanced" => $advanced_keywords
        ];

        foreach ($difficulty_topics as $topic_name => $difficulty) {
            // Lấy chủ đề theo tên
            $topic_id = $this->getTopicIdByName($topic_name);
            
            if (!$topic_id) {
                echo "Không tìm thấy chủ đề {$topic_name}. Bỏ qua...\n";
                continue;
            }
            
            // Lấy danh sách bài học của chủ đề
            $lessons = $this->getLessonsByTopic($topic_id);
            
            if (empty($lessons)) {
                echo "Không tìm thấy bài học nào cho chủ đề {$topic_name}. Bỏ qua...\n";
                continue;
            }
            
            // Tổ chức lại từ vựng cho mỗi bài học
            foreach ($lessons as $index => $lesson) {
                // Xóa tất cả từ vựng hiện tại của bài học
                $this->clearLessonVocabulary($lesson['lesson_id']);
                
                // Tìm từ vựng phù hợp dựa trên từ khóa
                $vocabs_to_add = [];
                if (isset($keywords_map[$topic_name][$lesson['title']])) {
                    $keywords = $keywords_map[$topic_name][$lesson['title']];
                    $vocabs_to_add = $this->findVocabsByKeywords($keywords);
                }
                
                // Nếu không đủ từ vựng, lấy thêm từ danh sách theo độ khó
                if (count($vocabs_to_add) < 15) {
                    $needed_count = 15 - count($vocabs_to_add);
                    $offset = $index * 15; // Offset để lấy các từ khác nhau cho mỗi bài học
                    
                    // Lấy danh sách từ vựng theo độ khó
                    $difficulty_vocabs = $this->getVocabsByDifficulty($difficulty, $needed_count * 2, $offset);
                    
                    // Lọc để chỉ lấy những từ chưa có trong vocabs_to_add
                    foreach ($difficulty_vocabs as $vocab) {
                        $exists = false;
                        foreach ($vocabs_to_add as $existing) {
                            if ($existing['vocab_id'] == $vocab['vocab_id']) {
                                $exists = true;
                                break;
                            }
                        }
                        
                        if (!$exists && count($vocabs_to_add) < 15) {
                            $vocabs_to_add[] = $vocab;
                        }
                        
                        if (count($vocabs_to_add) >= 15) {
                            break;
                        }
                    }
                }
                
                // Thêm từ vựng vào bài học
                $display_order = 1;
                foreach ($vocabs_to_add as $vocab) {
                    $this->linkVocabToLesson($lesson['lesson_id'], $vocab['vocab_id'], $display_order);
                    $display_order++;
                }
                
                echo "Đã thêm " . count($vocabs_to_add) . " từ vựng vào bài học {$lesson['title']}.\n";
            }
        }
        
        echo "Đã tổ chức lại từ vựng theo độ khó!\n";
        return true;
    }

    // Tổ chức lại từ vựng trong bài học theo chủ đề thực tế
    public function reorganizeVocabularyByThematic() {
        $thematic_topics = [
            "Travel and Transportation",
            "Food and Dining",
            "Business and Work",
            "Technology and Internet"
        ];
        
        foreach ($thematic_topics as $topic_name) {
            // Lấy chủ đề theo tên
            $topic_id = $this->getTopicIdByName($topic_name);
            
            if (!$topic_id) {
                echo "Không tìm thấy chủ đề {$topic_name}. Bỏ qua...\n";
                continue;
            }
            
            // Lấy danh sách bài học của chủ đề
            $lessons = $this->getLessonsByTopic($topic_id);
            
            if (empty($lessons)) {
                echo "Không tìm thấy bài học nào cho chủ đề {$topic_name}. Bỏ qua...\n";
                continue;
            }
            
            // Tổ chức lại từ vựng cho mỗi bài học
            foreach ($lessons as $index => $lesson) {
                // Xóa tất cả từ vựng hiện tại của bài học
                $this->clearLessonVocabulary($lesson['lesson_id']);
                
                // Tìm từ vựng phù hợp dựa trên từ khóa
                $vocabs_to_add = [];
                if (isset($this->thematicMapping[$topic_name][$lesson['title']])) {
                    $keywords = $this->thematicMapping[$topic_name][$lesson['title']];
                    $vocabs_to_add = $this->findVocabsByKeywords($keywords);
                }
                
                // Nếu không đủ từ vựng, lấy thêm từ bất kỳ
                if (count($vocabs_to_add) < 15) {
                    $needed_count = 15 - count($vocabs_to_add);
                    
                    // Lấy từ vựng ngẫu nhiên
                    $query = "SELECT vocab_id, word, meaning, word_type, difficulty_level FROM Vocabulary ORDER BY RAND() LIMIT ?";
                    $stmt = $this->conn->prepare($query);
                    $stmt->bindParam(1, $needed_count, PDO::PARAM_INT);
                    $stmt->execute();
                    $random_vocabs = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    // Lọc để chỉ lấy những từ chưa có trong vocabs_to_add
                    foreach ($random_vocabs as $vocab) {
                        $exists = false;
                        foreach ($vocabs_to_add as $existing) {
                            if ($existing['vocab_id'] == $vocab['vocab_id']) {
                                $exists = true;
                                break;
                            }
                        }
                        
                        if (!$exists) {
                            $vocabs_to_add[] = $vocab;
                        }
                    }
                }
                
                // Thêm từ vựng vào bài học
                $display_order = 1;
                foreach ($vocabs_to_add as $vocab) {
                    if ($display_order > 15) break; // Giới hạn 15 từ mỗi bài học
                    $this->linkVocabToLesson($lesson['lesson_id'], $vocab['vocab_id'], $display_order);
                    $display_order++;
                }
                
                echo "Đã thêm " . count($vocabs_to_add) . " từ vựng vào bài học {$lesson['title']}.\n";
            }
        }
        
        echo "Đã tổ chức lại từ vựng theo chủ đề thực tế!\n";
        return true;
    }

    // Tổ chức lại từ vựng trong bài học "Common English Words"
    public function reorganizeCommonVocabulary() {
        // Lấy chủ đề "Common English Words"
        $topic_id = $this->getTopicIdByName("Common English Words");
        
        if (!$topic_id) {
            echo "Không tìm thấy chủ đề Common English Words. Bỏ qua...\n";
            return false;
        }
        
        // Lấy danh sách bài học của chủ đề
        $lessons = $this->getLessonsByTopic($topic_id);
        
        if (empty($lessons)) {
            echo "Không tìm thấy bài học nào cho chủ đề Common English Words. Bỏ qua...\n";
            return false;
        }
        
        // Các từ vựng phổ biến
        foreach ($lessons as $index => $lesson) {
            // Xóa tất cả từ vựng hiện tại của bài học
            $this->clearLessonVocabulary($lesson['lesson_id']);
            
            // Tìm từ vựng phù hợp dựa trên từ khóa
            $vocabs_to_add = [];
            if (isset($this->commonVocabulary[$lesson['title']])) {
                $keywords = $this->commonVocabulary[$lesson['title']];
                $vocabs_to_add = $this->findVocabsByKeywords($keywords);
            } else {
                // Lấy từ vựng phổ biến bất kỳ
                $query = "SELECT vocab_id, word, meaning, word_type, difficulty_level FROM Vocabulary 
                        WHERE difficulty_level = 'Easy' 
                        ORDER BY RAND() 
                        LIMIT 15";
                $stmt = $this->conn->prepare($query);
                $stmt->execute();
                $vocabs_to_add = $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
            
            // Thêm từ vựng vào bài học
            $display_order = 1;
            foreach ($vocabs_to_add as $vocab) {
                if ($display_order > 15) break; // Giới hạn 15 từ mỗi bài học
                $this->linkVocabToLesson($lesson['lesson_id'], $vocab['vocab_id'], $display_order);
                $display_order++;
            }
            
            echo "Đã thêm " . count($vocabs_to_add) . " từ vựng vào bài học {$lesson['title']}.\n";
        }
        
        echo "Đã tổ chức lại từ vựng phổ biến!\n";
        return true;
    }

    // Tổ chức lại tất cả từ vựng trong bảng LessonVocabulary
    public function reorganizeAllVocabulary() {
        echo "Bắt đầu tổ chức lại từ vựng trong các bài học...\n";
        
        // Tổ chức lại từ vựng theo loại từ
        $this->reorganizeVocabularyByWordType();
        
        // Tổ chức lại từ vựng theo độ khó
        $this->reorganizeVocabularyByDifficulty();
        
        // Tổ chức lại từ vựng theo chủ đề thực tế
        $this->reorganizeVocabularyByThematic();
        
        // Tổ chức lại từ vựng phổ biến
        $this->reorganizeCommonVocabulary();
        
        // Kiểm tra số lượng từ vựng đã được gán
        $query = "SELECT COUNT(DISTINCT vocab_id) as count FROM LessonVocabulary";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo "Đã gán {$result['count']} từ vựng vào các bài học.\n";
        
        // Kiểm tra từ vựng chưa được gán
        $query = "SELECT COUNT(*) as count FROM Vocabulary v 
                LEFT JOIN LessonVocabulary lv ON v.vocab_id = lv.vocab_id 
                WHERE lv.lesson_vocab_id IS NULL";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['count'] > 0) {
            echo "Còn {$result['count']} từ vựng chưa được gán vào bài học nào.\n";
            $this->assignRemainingVocabulary();
        } else {
            echo "Tất cả từ vựng đã được gán vào các bài học phù hợp.\n";
        }
        
        return true;
    }
    
    // Gán các từ vựng còn lại vào bài học phù hợp
    private function assignRemainingVocabulary() {
        // Lấy danh sách từ vựng chưa được gán
        $query = "SELECT v.vocab_id, v.word, v.word_type, v.difficulty_level 
                    FROM Vocabulary v 
                    LEFT JOIN LessonVocabulary lv ON v.vocab_id = lv.vocab_id 
                    WHERE lv.lesson_vocab_id IS NULL";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $unassigned = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($unassigned)) {
            echo "Không có từ vựng nào cần gán.\n";
            return true;
        }
        
        echo "Đang gán {$stmt->rowCount()} từ vựng còn lại...\n";
        
        // Phân loại từ vựng theo loại từ và độ khó
        $vocabs_by_type = [];
        $vocabs_by_difficulty = [];
        
        foreach ($unassigned as $vocab) {
            // Phân loại theo loại từ
            $word_type = $vocab['word_type'] ? $vocab['word_type'] : 'unknown';
            if (!isset($vocabs_by_type[$word_type])) {
                $vocabs_by_type[$word_type] = [];
            }
            $vocabs_by_type[$word_type][] = $vocab;
            
            // Phân loại theo độ khó
            $difficulty = $vocab['difficulty_level'] ? $vocab['difficulty_level'] : 'Easy';
            if (!isset($vocabs_by_difficulty[$difficulty])) {
                $vocabs_by_difficulty[$difficulty] = [];
            }
            $vocabs_by_difficulty[$difficulty][] = $vocab;
        }
        
        // Gán từ vựng theo loại từ
        $word_types = ['noun', 'verb', 'adjective', 'adverb', 'determiner', 'pronoun', 'conjunction', 'preposition', 'interjection', 'unknown'];
        foreach ($word_types as $word_type) {
            if (!isset($vocabs_by_type[$word_type]) || empty($vocabs_by_type[$word_type])) {
                continue;
            }
            
            // Tìm chủ đề và bài học phù hợp
            $topic_name = ucfirst($word_type) . 's'; // Chuyển thành số nhiều, ví dụ: "Nouns", "Verbs"...
            if ($word_type == 'unknown') {
                $topic_name = "Common English Words"; // Đưa từ không xác định vào Common English Words
            }
            
            $topic_id = $this->getTopicIdByName($topic_name);
            
            if (!$topic_id) {
                // Nếu không tìm thấy chủ đề, gán vào Common English Words
                $topic_id = $this->getTopicIdByName("Common English Words");
            }
            
            if ($topic_id) {
                $lessons = $this->getLessonsByTopic($topic_id);
                
                if (!empty($lessons)) {
                    $vocabs = $vocabs_by_type[$word_type];
                    $vocabs_per_lesson = ceil(count($vocabs) / count($lessons));
                    
                    // Phân phối từ vựng cho các bài học
                    $current_vocab = 0;
                    foreach ($lessons as $lesson) {
                        for ($i = 0; $i < $vocabs_per_lesson && $current_vocab < count($vocabs); $i++) {
                            $vocab = $vocabs[$current_vocab];
                            
                            // Lấy display_order tiếp theo
                            $order_query = "SELECT MAX(display_order) as max_order FROM LessonVocabulary WHERE lesson_id = ?";
                            $order_stmt = $this->conn->prepare($order_query);
                            $order_stmt->bindParam(1, $lesson['lesson_id']);
                            $order_stmt->execute();
                            $max_order = $order_stmt->fetch(PDO::FETCH_ASSOC);
                            
                            $display_order = ($max_order['max_order'] !== null) ? $max_order['max_order'] + 1 : 1;
                            
                            $this->linkVocabToLesson($lesson['lesson_id'], $vocab['vocab_id'], $display_order);
                            $current_vocab++;
                        }
                    }
                }
            }
        }
        
        // Kiểm tra lại số lượng từ vựng chưa được gán
        $query = "SELECT COUNT(*) as count FROM Vocabulary v 
                    LEFT JOIN LessonVocabulary lv ON v.vocab_id = lv.vocab_id 
                    WHERE lv.lesson_vocab_id IS NULL";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['count'] > 0) {
            echo "Vẫn còn {$result['count']} từ vựng chưa được gán. Gán vào Common English Words...\n";
            
            // Lấy danh sách bài học của Common English Words
            $topic_id = $this->getTopicIdByName("Common English Words");
            if ($topic_id) {
                $lessons = $this->getLessonsByTopic($topic_id);
                
                if (!empty($lessons)) {
                    // Lấy danh sách từ vựng chưa được gán
                    $query = "SELECT v.vocab_id, v.word FROM Vocabulary v 
                                LEFT JOIN LessonVocabulary lv ON v.vocab_id = lv.vocab_id 
                                WHERE lv.lesson_vocab_id IS NULL";
                    $stmt = $this->conn->prepare($query);
                    $stmt->execute();
                    $remaining = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    // Phân phối từ vựng cho các bài học
                    $lesson_index = 0;
                    foreach ($remaining as $vocab) {
                        $lesson = $lessons[$lesson_index % count($lessons)];
                        
                        // Lấy display_order tiếp theo
                        $order_query = "SELECT MAX(display_order) as max_order FROM LessonVocabulary WHERE lesson_id = ?";
                        $order_stmt = $this->conn->prepare($order_query);
                        $order_stmt->bindParam(1, $lesson['lesson_id']);
                        $order_stmt->execute();
                        $max_order = $order_stmt->fetch(PDO::FETCH_ASSOC);
                        
                        $display_order = ($max_order['max_order'] !== null) ? $max_order['max_order'] + 1 : 1;
                        
                        $this->linkVocabToLesson($lesson['lesson_id'], $vocab['vocab_id'], $display_order);
                        $lesson_index++;
                    }
                }
            }
        }
        
        echo "Đã hoàn tất việc gán từ vựng còn lại.\n";
        return true;
    }
    
    // Tìm kiếm từ vựng chưa được gán vào bài học nào
    public function findUnassignedVocabulary() {
        $query = "SELECT v.vocab_id, v.word, v.meaning, v.word_type, v.difficulty_level 
                    FROM Vocabulary v 
                    LEFT JOIN LessonVocabulary lv ON v.vocab_id = lv.vocab_id 
                    WHERE lv.lesson_vocab_id IS NULL";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "Tìm thấy " . count($results) . " từ vựng chưa được gán vào bài học nào.\n";
        
        return $results;
    }
    
    // Tự động gán từ vựng chưa được sử dụng vào bài học phù hợp
    public function assignUnusedVocabulary() {
        $unassigned = $this->findUnassignedVocabulary();
        
        if (empty($unassigned)) {
            echo "Không có từ vựng nào cần gán.\n";
            return true;
        }
        
        $count = 0;
        foreach ($unassigned as $vocab) {
            // Tìm bài học phù hợp dựa trên độ khó
            $difficulty_map = [
                "Easy" => "Beginner",
                "Medium" => "Intermediate",
                "Hard" => "Advanced"
            ];
            
            $topic_name = isset($difficulty_map[$vocab['difficulty_level']]) ? $difficulty_map[$vocab['difficulty_level']] : "Common English Words";
            
            // Lấy một bài học ngẫu nhiên trong chủ đề phù hợp
            $query = "SELECT l.lesson_id 
                        FROM Lessons l 
                        JOIN TopicLessons tl ON l.lesson_id = tl.lesson_id 
                        JOIN Topics t ON tl.topic_id = t.topic_id 
                        WHERE t.topic_name = ? 
                        ORDER BY RAND() 
                        LIMIT 1";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(1, $topic_name);
            $stmt->execute();
            
            $lesson = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($lesson) {
                // Tính display_order tiếp theo
                $order_query = "SELECT MAX(display_order) as max_order FROM LessonVocabulary WHERE lesson_id = ?";
                $order_stmt = $this->conn->prepare($order_query);
                $order_stmt->bindParam(1, $lesson['lesson_id']);
                $order_stmt->execute();
                $max_order = $order_stmt->fetch(PDO::FETCH_ASSOC);
                
                $display_order = ($max_order['max_order'] !== null) ? $max_order['max_order'] + 1 : 1;
                
                // Gán từ vựng vào bài học
                if ($this->linkVocabToLesson($lesson['lesson_id'], $vocab['vocab_id'], $display_order)) {
                    $count++;
                }
            }
        }
        
        echo "Đã gán thành công {$count} từ vựng vào các bài học phù hợp.\n";
        return ($count > 0);
    }
    
    // Kiểm tra và hiển thị thông tin về các bảng dữ liệu
    public function checkDatabaseStatus() {
        // Kiểm tra bảng Topics
        $query = "SELECT COUNT(*) as count FROM Topics";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "Tổng số chủ đề: {$result['count']}\n";
        
        // Kiểm tra bảng Lessons
        $query = "SELECT COUNT(*) as count FROM Lessons";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "Tổng số bài học: {$result['count']}\n";
        
        // Kiểm tra bảng TopicLessons
        $query = "SELECT COUNT(*) as count FROM TopicLessons";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "Tổng số liên kết chủ đề-bài học: {$result['count']}\n";
        
        // Kiểm tra bảng LessonVocabulary
        $query = "SELECT COUNT(*) as count FROM LessonVocabulary";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        echo "Tổng số liên kết bài học-từ vựng: {$result['count']}\n";
        
        // Kiểm tra từ vựng chưa được gán
        $query = "SELECT COUNT(*) as count FROM Vocabulary v 
                    LEFT JOIN LessonVocabulary lv ON v.vocab_id = lv.vocab_id 
                    WHERE lv.lesson_vocab_id IS NULL";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['count'] > 0) {
            echo "Còn {$result['count']} từ vựng chưa được gán vào bài học nào.\n";
        } else {
            echo "Tất cả từ vựng đã được gán vào các bài học phù hợp.\n";
        }
        
        return true;
    }
}
?>
