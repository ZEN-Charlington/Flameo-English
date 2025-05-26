<?php
// api.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Xử lý CORS preflight request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit();
}

// Include files cấu hình
require_once 'config/Constants.php';
require_once 'config/database.php';

// Khởi tạo kết nối database
$database = new Database();
$db = $database->getConnection();

// Include các models
require_once 'models/User.php';
require_once 'models/StudentProfile.php';
require_once 'models/Vocabulary.php';
require_once 'models/Lesson.php';
require_once 'models/LessonVocabulary.php';
require_once 'models/Topic.php';
require_once 'models/TopicLesson.php';
require_once 'models/Progress.php';

// Include các controllers
require_once 'controllers/AuthController.php';
require_once 'controllers/AuthMiddleware.php';
require_once 'controllers/UserController.php';
require_once 'controllers/VocabularyController.php';
require_once 'controllers/LessonController.php';
require_once 'controllers/TopicController.php';
require_once 'controllers/ProgressController.php';
require_once 'controllers/PasswordResetController.php';
require_once 'controllers/StudentProfileController.php';


// Khởi tạo các controllers
$authController = new AuthController($db);
$authMiddleware = new AuthMiddleware($authController);
$userController = new UserController($db);
$vocabController = new VocabularyController($db);
$lessonController = new LessonController($db);
$topicController = new TopicController($db);
$progressController = new ProgressController($db);
$passwordResetController = new PasswordResetController($db);
$studentProfileController = new StudentProfileController($db);

// Lấy request method và endpoint
$request_method = $_SERVER["REQUEST_METHOD"];
$request_uri = $_SERVER["REQUEST_URI"];
$url_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));
$endpoint = end($url_parts);

// Lấy ID từ URL nếu có
$id = null;
if (count($url_parts) > 1 && is_numeric($url_parts[count($url_parts) - 1])) {
    $id = intval($url_parts[count($url_parts) - 1]);
    $endpoint = $url_parts[count($url_parts) - 2];
}

// Lấy dữ liệu từ request
$data = json_decode(file_get_contents("php://input"), true);
if (!$data) {
    $data = $_POST;
}

// Xử lý API routes
switch ($request_method) {
    case 'GET':
        handleGetRequests();
        break;
    case 'POST':
        handlePostRequests();
        break;
    case 'PUT':
        handlePutRequests();
        break;
    case 'DELETE':
        handleDeleteRequests();
        break;
    default:
        echo json_encode(["status" => "error", "message" => "Request method không hợp lệ"]);
        break;
}

// Xử lý GET requests
function handleGetRequests() {
    global $authMiddleware, $userController, $vocabController, 
           $lessonController, $topicController, $progressController, $studentProfileController,
           $endpoint, $id, $url_parts;
    switch ($endpoint) {
        case 'user-info':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($userController->getUserInfo($userData['user_id']));
            } else {
                echo json_encode([
                    "status" => 401,
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;
            
        case 'vocabulary':
            if ($id) {
                // Nếu đã xác thực, lấy thông tin từ vựng kèm tiến độ học
                $userData = $authMiddleware->isAuthenticated();
                if ($userData) {
                    echo json_encode($vocabController->getVocabularyWithProgress($id, $userData['user_id']));
                } else {
                    echo json_encode($vocabController->getVocabulary($id));
                }
            } else {
                echo json_encode($vocabController->getAllVocabulary());
            }
            break;
            
        case 'search-vocabulary':
            $keyword = isset($_GET['keyword']) ? $_GET['keyword'] : '';
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($vocabController->searchVocabulary($keyword, $userData['user_id']));
            } else {
                echo json_encode($vocabController->searchVocabulary($keyword));
            }
            break;
            
        case 'random-vocabulary':
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($vocabController->getRandomVocabulary($limit, $userData['user_id']));
            } else {
                echo json_encode($vocabController->getRandomVocabulary($limit));
            }
            break;
            
        case 'lessons':
            if ($id) {
                echo json_encode($lessonController->getLesson($id));
            } else {
                echo json_encode($lessonController->getAllLessons());
            }
            break;
            
        case 'topics':
            if ($id) {
                $userData = $authMiddleware->isAuthenticated();
                if ($userData && isset($_GET['with_progress'])) {
                    echo json_encode($topicController->getTopicWithProgress($id, $userData['user_id']));
                } else {
                    echo json_encode($topicController->getTopic($id));
                }
            } else {
                $userData = $authMiddleware->isAuthenticated();
                if ($userData && isset($_GET['with_progress'])) {
                    echo json_encode($topicController->getAllTopicsWithProgress($userData['user_id']));
                } else {
                    echo json_encode($topicController->getAllTopics());
                }
            }
            break;

        case 'today-vocabulary':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($progressController->getTodayVocabulary($userData['user_id']));
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;
        case 'today-yesterday-vocabulary':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($progressController->getTodayAndYesterdayVocabulary($userData['user_id']));
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;
        case 'similar-words':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                $word_type = isset($_GET['word_type']) ? $_GET['word_type'] : 'noun';
                $vocab_id = isset($_GET['vocab_id']) ? intval($_GET['vocab_id']) : 0;
                $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 5;
                
                echo json_encode($progressController->getSimilarWords($word_type, $vocab_id, $limit));
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;
        case 'vocabulary-stats-by-type':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($vocabController->getVocabularyStatsByType($userData['user_id']));
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;
            
        case 'learning-stats':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($progressController->getLearningStats($userData['user_id']));
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;
                    
        case 'topic-lessons':
            $topic_id = isset($_GET['topic_id']) ? intval($_GET['topic_id']) : 0;
            if ($topic_id > 0) {
                $userData = $authMiddleware->isAuthenticated();
                if ($userData) {
                    echo json_encode($lessonController->getLessonsByTopic($topic_id, $userData['user_id']));
                } else {
                    echo json_encode($lessonController->getLessonsByTopic($topic_id));
                }
            } else {
                echo json_encode(["status" => 400, "message" => "Thiếu topic_id"]);
            }
            break;
            
        case 'lesson-vocabulary':
            $lesson_id = isset($_GET['lesson_id']) ? intval($_GET['lesson_id']) : 0;
            if ($lesson_id > 0) {
                $userData = $authMiddleware->isAuthenticated();
                if ($userData) {
                    echo json_encode($lessonController->getLessonVocabularyWithProgress($lesson_id, $userData['user_id']));
                } else {
                    $lesson = $lessonController->getLesson($lesson_id);
                    echo json_encode($lesson);
                }
            } else {
                echo json_encode(["status" => 400, "message" => "Thiếu lesson_id"]);
            }
            break;
            
        case 'user-progress':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($progressController->getUserVocabProgress($userData['user_id']));
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;
            
        case 'progress-stats':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($progressController->getVocabProgressStats($userData['user_id']));
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;
            
        case 'words-to-review':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
                echo json_encode($progressController->getWordsToReview($userData['user_id'], $limit));
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;
            
        case 'topics-with-progress':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($progressController->getUserTopicsProgress($userData['user_id']));
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;
        case 'notebook-vocabulary':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($progressController->getUserVocabWithDetails($userData['user_id']));
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;
            
        case 'completed-lessons':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($progressController->getUserCompletedLessons($userData['user_id']));
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;
            
        case 'lesson-progress':
            $userData = $authMiddleware->isAuthenticated();
            $lesson_id = isset($_GET['lesson_id']) ? intval($_GET['lesson_id']) : 0;
            if ($userData && $lesson_id > 0) {
                echo json_encode($progressController->calculateLessonProgress($userData['user_id'], $lesson_id));
            } else {
                echo json_encode([
                    "status" => 400, 
                    "message" => "Thiếu lesson_id hoặc chưa xác thực"
                ]);
            }
            break;
            
        case 'overall-progress':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($progressController->getOverallProgress($userData['user_id']));
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;
        case 'notebook-memorized':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($progressController->getMemorizedVocabulary($userData['user_id']));
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;

        case 'notebook-not-memorized':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($progressController->getNotMemorizedVocabulary($userData['user_id']));
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;

        case 'notebook-all':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($progressController->getAllNotebookVocabulary($userData['user_id']));
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;
        case 'student-profile':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($studentProfileController->getProfile($userData['user_id']));
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;

        default:
            echo json_encode(["status" => 404, "message" => "Endpoint không hợp lệ"]);
            break;
    }
}

// Xử lý POST requests
function handlePostRequests() {
    global $authController, $authMiddleware, $userController, 
           $progressController, $passwordResetController, $studentProfileController, $endpoint, $data;
    
    switch ($endpoint) {
        case 'login':
            if (isset($data['email']) && isset($data['password'])) {
                echo json_encode($authController->login($data));
            } else {
                echo json_encode([
                    "status" => 400, 
                    "message" => ERROR_EMAIL_PASSWORD_REQUIRED
                ]);
            }
            break;
            
        case 'register':
            if (isset($data['email']) && isset($data['password'])) {
                // Đặt giá trị mặc định cho display_name nếu không có
                $data['display_name'] = isset($data['display_name']) ? $data['display_name'] : DEFAULT_DISPLAY_NAME;
                echo json_encode($authController->register($data));
            } else {
                echo json_encode([
                    "status" => 400, 
                    "message" => ERROR_EMAIL_PASSWORD_REQUIRED
                ]);
            }
            break;
            
        case 'update-vocab-progress':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                if (isset($data['vocab_id']) && isset($data['is_memorized'])) {
                    echo json_encode($progressController->updateVocabProgress(
                        $userData['user_id'], 
                        $data['vocab_id'], 
                        $data['is_memorized']
                    ));
                } else {
                    echo json_encode([
                        "status" => 400, 
                        "message" => "Thiếu vocab_id hoặc is_memorized"
                    ]);
                }
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;
            
        case 'complete-lesson':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                if (isset($data['lesson_id'])) {
                    echo json_encode($progressController->handleCompleteLessonRequest(
                        $userData['user_id'], 
                        $data['lesson_id']
                    ));
                } else {
                    echo json_encode([
                        "status" => 400, 
                        "message" => "Thiếu lesson_id"
                    ]);
                }
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;
            
        case 'update-topic-progress':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                if (isset($data['topic_id'])) {
                    echo json_encode($progressController->updateTopicProgress(
                        $userData['user_id'], 
                        $data['topic_id']
                    ));
                } else {
                    echo json_encode([
                        "status" => 400, 
                        "message" => "Thiếu topic_id"
                    ]);
                }
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;
            
        case 'check-lesson-completion':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                if (isset($data['lesson_id'])) {
                    echo json_encode($progressController->checkAndUpdateLessonCompletion(
                        $userData['user_id'], 
                        $data['lesson_id']
                    ));
                } else {
                    echo json_encode([
                        "status" => 400, 
                        "message" => "Thiếu lesson_id"
                    ]);
                }
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;
            
        case 'update-profile':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($userController->updateProfile($userData['user_id'], $data));
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;

        case 'verify-otp':
            if (isset($data['otp'])) {
                echo json_encode($passwordResetController->verifyOTP($data));
            } else {
                echo json_encode([
                    "status" => 400, 
                    "message" => "Thiếu mã OTP"
                ]);
            }
            break;

        case 'reset-password':
            if (isset($data['otp']) && isset($data['new_password'])) {
                echo json_encode($passwordResetController->resetPassword($data));
            } else {
                echo json_encode([
                    "status" => 400, 
                    "message" => "Thiếu OTP hoặc mật khẩu mới"
                ]);
            }
            break;

        case 'forgot-password':
            if (isset($data['email'])) {
                echo json_encode($passwordResetController->forgotPassword($data));
            } else {
                echo json_encode([
                    "status" => 400, 
                    "message" => "Thiếu email"
                ]);
            }
            break;


        case 'reset-progress':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($progressController->resetUserProgress($userData['user_id']));
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;
            
        case 'create-progress-tables':
            $userData = $authMiddleware->isAdmin();
            if ($userData) {
                echo json_encode($progressController->createTablesIfNotExist());
            } else {
                echo json_encode([
                    "status" => 403, 
                    "message" => "Không có quyền thực hiện thao tác này"
                ]);
            }
            break;
        case 'student-profile':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($studentProfileController->createOrUpdateProfile($userData['user_id'], $data));
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;     
        default:
            echo json_encode(["status" => 404, "message" => "Endpoint không hợp lệ"]);
            break;
    }
}

// Xử lý PUT requests
function handlePutRequests() {
    global $authMiddleware, $userController, $studentProfileController, $endpoint, $id, $data;
    
    switch ($endpoint) {
        case 'user-info':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($userController->updateUserInfo($userData['user_id'], $data));
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;
            
        case 'profile':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($userController->updateProfile($userData['user_id'], $data));
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;
        case 'student-profile':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($studentProfileController->createOrUpdateProfile($userData['user_id'], $data));
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;

        default:
            echo json_encode(["status" => 404, "message" => "Endpoint không hợp lệ"]);
            break;
    }
}

function handleDeleteRequests() {
    global $authMiddleware, $studentProfileController, $endpoint, $id;
    
    switch ($endpoint) {
        case 'student-profile':
            // User có thể xóa profile của chính mình
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                echo json_encode($studentProfileController->deleteProfile($userData['user_id']));
            } else {
                echo json_encode([
                    "status" => 401, 
                    "message" => ERROR_UNAUTHORIZED
                ]);
            }
            break;
            
        default:
            // Các endpoint khác chỉ admin mới được xóa
            $userData = $authMiddleware->isAdmin();
            if (!$userData) {
                echo json_encode([
                    "status" => 403, 
                    "message" => "Không có quyền thực hiện thao tác này"
                ]);
                exit();
            }
            
            echo json_encode(["status" => 404, "message" => "Endpoint không hợp lệ"]);
            break;
    }
}
?>