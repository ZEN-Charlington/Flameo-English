<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit();
}

require_once 'config/Constants.php';
require_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

require_once 'models/User.php';
require_once 'models/StudentProfile.php';
require_once 'models/Vocabulary.php';
require_once 'models/Lesson.php';
require_once 'models/LessonVocabulary.php';
require_once 'models/Topic.php';
require_once 'models/TopicLesson.php';
require_once 'models/Progress.php';

require_once 'controllers/AuthController.php';
require_once 'controllers/AuthMiddleware.php';
require_once 'controllers/UserController.php';
require_once 'controllers/VocabularyController.php';
require_once 'controllers/LessonController.php';
require_once 'controllers/TopicController.php';
require_once 'controllers/ProgressController.php';
require_once 'controllers/PasswordResetController.php';
require_once 'controllers/StudentProfileController.php';
require_once 'controllers/AdminController.php';

$authController = new AuthController($db);
$authMiddleware = new AuthMiddleware($authController);
$userController = new UserController($db);
$vocabController = new VocabularyController($db);
$lessonController = new LessonController($db);
$topicController = new TopicController($db);
$progressController = new ProgressController($db);
$passwordResetController = new PasswordResetController($db);
$studentProfileController = new StudentProfileController($db);
$adminController = new AdminController($db);

$request_method = $_SERVER["REQUEST_METHOD"];
$request_uri = $_SERVER["REQUEST_URI"];
$path = trim(parse_url($request_uri, PHP_URL_PATH), '/');
$url_parts = explode('/', $path);

$data = json_decode(file_get_contents("php://input"), true) ?: $_POST;

$is_admin_route = strpos($path, 'admin/') !== false;

if ($is_admin_route) {
    handleAdminRoutes();
} else {
    handleUserRoutes();
}

function handleUserRoutes() {
    global $request_method, $url_parts, $authMiddleware, $userController, $vocabController, $lessonController, $topicController, $progressController, $passwordResetController, $studentProfileController, $data;
    
    $endpoint = end($url_parts);
    $id = null;
    if (count($url_parts) > 1 && is_numeric($url_parts[count($url_parts) - 1])) {
        $id = intval($url_parts[count($url_parts) - 1]);
        $endpoint = $url_parts[count($url_parts) - 2];
    }

    switch ($request_method) {
        case 'GET': handleUserGetRequests($endpoint, $id); break;
        case 'POST': handleUserPostRequests($endpoint, $data); break;
        case 'PUT': handleUserPutRequests($endpoint, $id, $data); break;
        case 'DELETE': handleUserDeleteRequests($endpoint, $id); break;
        default: echo json_encode(["status" => "error", "message" => "Request method không hợp lệ"]); break;
    }
}

function handleUserGetRequests($endpoint, $id) {
    global $authMiddleware, $userController, $vocabController, $lessonController, $topicController, $progressController, $studentProfileController;
    
    switch ($endpoint) {
        case 'user-info':
            $userData = $authMiddleware->isAuthenticated();
            echo json_encode($userData ? $userController->getUserInfo($userData['user_id']) : ["status" => 401, "message" => ERROR_UNAUTHORIZED]);
            break;
        case 'vocabulary':
            if ($id) {
                $userData = $authMiddleware->isAuthenticated();
                echo json_encode($userData ? $vocabController->getVocabularyWithProgress($id, $userData['user_id']) : $vocabController->getVocabulary($id));
            } else {
                echo json_encode($vocabController->getAllVocabulary());
            }
            break;
        case 'search-vocabulary':
            $keyword = $_GET['keyword'] ?? '';
            $userData = $authMiddleware->isAuthenticated();
            echo json_encode($userData ? $vocabController->searchVocabulary($keyword, $userData['user_id']) : $vocabController->searchVocabulary($keyword));
            break;
        case 'random-vocabulary':
            $limit = intval($_GET['limit'] ?? 10);
            $userData = $authMiddleware->isAuthenticated();
            echo json_encode($userData ? $vocabController->getRandomVocabulary($limit, $userData['user_id']) : $vocabController->getRandomVocabulary($limit));
            break;
        case 'lessons':
            echo json_encode($id ? $lessonController->getLesson($id) : $lessonController->getAllLessons());
            break;
        case 'topics':
            if ($id) {
                $userData = $authMiddleware->isAuthenticated();
                echo json_encode(($userData && isset($_GET['with_progress'])) ? $topicController->getTopicWithProgress($id, $userData['user_id']) : $topicController->getTopic($id));
            } else {
                $userData = $authMiddleware->isAuthenticated();
                echo json_encode(($userData && isset($_GET['with_progress'])) ? $topicController->getAllTopicsWithProgress($userData['user_id']) : $topicController->getAllTopics());
            }
            break;
        case 'today-vocabulary':
        case 'today-yesterday-vocabulary':
        case 'vocabulary-stats-by-type':
        case 'learning-stats':
        case 'user-progress':
        case 'progress-stats':
        case 'words-to-review':
        case 'topics-with-progress':
        case 'notebook-vocabulary':
        case 'completed-lessons':
        case 'overall-progress':
        case 'notebook-memorized':
        case 'notebook-not-memorized':
        case 'notebook-all':
            $userData = $authMiddleware->isAuthenticated();
            if (!$userData) {
                echo json_encode(["status" => 401, "message" => ERROR_UNAUTHORIZED]);
                break;
            }
            switch ($endpoint) {
                case 'today-vocabulary': echo json_encode($progressController->getTodayVocabulary($userData['user_id'])); break;
                case 'today-yesterday-vocabulary': echo json_encode($progressController->getTodayAndYesterdayVocabulary($userData['user_id'])); break;
                case 'vocabulary-stats-by-type': echo json_encode($vocabController->getVocabularyStatsByType($userData['user_id'])); break;
                case 'learning-stats': echo json_encode($progressController->getLearningStats($userData['user_id'])); break;
                case 'user-progress': echo json_encode($progressController->getUserVocabProgress($userData['user_id'])); break;
                case 'progress-stats': echo json_encode($progressController->getVocabProgressStats($userData['user_id'])); break;
                case 'words-to-review': 
                    $limit = intval($_GET['limit'] ?? 10);
                    echo json_encode($progressController->getWordsToReview($userData['user_id'], $limit)); 
                    break;
                case 'topics-with-progress': echo json_encode($progressController->getUserTopicsProgress($userData['user_id'])); break;
                case 'notebook-vocabulary': echo json_encode($progressController->getUserVocabWithDetails($userData['user_id'])); break;
                case 'completed-lessons': echo json_encode($progressController->getUserCompletedLessons($userData['user_id'])); break;
                case 'overall-progress': echo json_encode($progressController->getOverallProgress($userData['user_id'])); break;
                case 'notebook-memorized': echo json_encode($progressController->getMemorizedVocabulary($userData['user_id'])); break;
                case 'notebook-not-memorized': echo json_encode($progressController->getNotMemorizedVocabulary($userData['user_id'])); break;
                case 'notebook-all': echo json_encode($progressController->getAllNotebookVocabulary($userData['user_id'])); break;
            }
            break;
        case 'similar-words':
            $userData = $authMiddleware->isAuthenticated();
            if ($userData) {
                $word_type = $_GET['word_type'] ?? 'noun';
                $vocab_id = intval($_GET['vocab_id'] ?? 0);
                $limit = intval($_GET['limit'] ?? 5);
                echo json_encode($progressController->getSimilarWords($word_type, $vocab_id, $limit));
            } else {
                echo json_encode(["status" => 401, "message" => ERROR_UNAUTHORIZED]);
            }
            break;
        case 'topic-lessons':
            $topic_id = intval($_GET['topic_id'] ?? 0);
            if ($topic_id > 0) {
                $userData = $authMiddleware->isAuthenticated();
                echo json_encode($userData ? $lessonController->getLessonsByTopic($topic_id, $userData['user_id']) : $lessonController->getLessonsByTopic($topic_id));
            } else {
                echo json_encode(["status" => 400, "message" => "Thiếu topic_id"]);
            }
            break;
        case 'lesson-vocabulary':
            $lesson_id = intval($_GET['lesson_id'] ?? 0);
            if ($lesson_id > 0) {
                $userData = $authMiddleware->isAuthenticated();
                echo json_encode($userData ? $lessonController->getLessonVocabularyWithProgress($lesson_id, $userData['user_id']) : $lessonController->getLesson($lesson_id));
            } else {
                echo json_encode(["status" => 400, "message" => "Thiếu lesson_id"]);
            }
            break;
        case 'lesson-progress':
            $userData = $authMiddleware->isAuthenticated();
            $lesson_id = intval($_GET['lesson_id'] ?? 0);
            if ($userData && $lesson_id > 0) {
                echo json_encode($progressController->calculateLessonProgress($userData['user_id'], $lesson_id));
            } else {
                echo json_encode(["status" => 400, "message" => "Thiếu lesson_id hoặc chưa xác thực"]);
            }
            break;
        case 'student-profile':
            $userData = $authMiddleware->isAuthenticated();
            echo json_encode($userData ? $studentProfileController->getProfile($userData['user_id']) : ["status" => 401, "message" => ERROR_UNAUTHORIZED]);
            break;
        case 'student-profile-completeness':
            $userData = $authMiddleware->isAuthenticated();
            echo json_encode($userData ? $studentProfileController->isProfileComplete($userData['user_id']) : ["status" => 401, "message" => ERROR_UNAUTHORIZED]);
            break;
        default:
            echo json_encode(["status" => 404, "message" => "Endpoint không hợp lệ"]);
            break;
    }
}

function handleUserPostRequests($endpoint, $data) {
    global $authController, $authMiddleware, $userController, $progressController, $passwordResetController, $studentProfileController;
    
    switch ($endpoint) {
        case 'login':
            echo json_encode((isset($data['email']) && isset($data['password'])) ? 
                $authController->login($data) : 
                ["status" => 400, "message" => ERROR_EMAIL_PASSWORD_REQUIRED]);
            break;
        case 'register':
            if (isset($data['email']) && isset($data['password'])) {
                $data['display_name'] = $data['display_name'] ?? DEFAULT_DISPLAY_NAME;
                echo json_encode($authController->register($data));
            } else {
                echo json_encode(["status" => 400, "message" => ERROR_EMAIL_PASSWORD_REQUIRED]);
            }
            break;
        case 'update-vocab-progress':
        case 'complete-lesson':
        case 'update-topic-progress':
        case 'check-lesson-completion':
        case 'update-profile':
        case 'reset-progress':
        case 'student-profile':
            $userData = $authMiddleware->isAuthenticated();
            if (!$userData) {
                echo json_encode(["status" => 401, "message" => ERROR_UNAUTHORIZED]);
                break;
            }
            switch ($endpoint) {
                case 'update-vocab-progress':
                    echo json_encode((isset($data['vocab_id']) && isset($data['is_memorized'])) ?
                        $progressController->updateVocabProgress($userData['user_id'], $data['vocab_id'], $data['is_memorized']) :
                        ["status" => 400, "message" => "Thiếu vocab_id hoặc is_memorized"]);
                    break;
                case 'complete-lesson':
                    echo json_encode(isset($data['lesson_id']) ?
                        $progressController->handleCompleteLessonRequest($userData['user_id'], $data['lesson_id']) :
                        ["status" => 400, "message" => "Thiếu lesson_id"]);
                    break;
                case 'update-topic-progress':
                    echo json_encode(isset($data['topic_id']) ?
                        $progressController->updateTopicProgress($userData['user_id'], $data['topic_id']) :
                        ["status" => 400, "message" => "Thiếu topic_id"]);
                    break;
                case 'check-lesson-completion':
                    echo json_encode(isset($data['lesson_id']) ?
                        $progressController->checkAndUpdateLessonCompletion($userData['user_id'], $data['lesson_id']) :
                        ["status" => 400, "message" => "Thiếu lesson_id"]);
                    break;
                case 'update-profile':
                    echo json_encode($userController->updateProfile($userData['user_id'], $data));
                    break;
                case 'reset-progress':
                    echo json_encode($progressController->resetUserProgress($userData['user_id']));
                    break;
                case 'student-profile':
                    echo json_encode($studentProfileController->createOrUpdateProfile($userData['user_id'], $data));
                    break;
            }
            break;
        case 'verify-otp':
            echo json_encode(isset($data['otp']) ? 
                $passwordResetController->verifyOTP($data) : 
                ["status" => 400, "message" => "Thiếu mã OTP"]);
            break;
        case 'reset-password':
            echo json_encode((isset($data['otp']) && isset($data['new_password'])) ?
                $passwordResetController->resetPassword($data) :
                ["status" => 400, "message" => "Thiếu OTP hoặc mật khẩu mới"]);
            break;
        case 'forgot-password':
            echo json_encode(isset($data['email']) ?
                $passwordResetController->forgotPassword($data) :
                ["status" => 400, "message" => "Thiếu email"]);
            break;
        case 'create-progress-tables':
            $userData = $authMiddleware->isAdmin();
            echo json_encode($userData ?
                $progressController->createTablesIfNotExist() :
                ["status" => 403, "message" => "Không có quyền thực hiện thao tác này"]);
            break;
        default:
            echo json_encode(["status" => 404, "message" => "Endpoint không hợp lệ"]);
            break;
    }
}

function handleUserPutRequests($endpoint, $id, $data) {
    global $authMiddleware, $userController, $studentProfileController;
    
    $userData = $authMiddleware->isAuthenticated();
    if (!$userData) {
        echo json_encode(["status" => 401, "message" => ERROR_UNAUTHORIZED]);
        return;
    }
    
    switch ($endpoint) {
        case 'user-info': echo json_encode($userController->updateUserInfo($userData['user_id'], $data)); break;
        case 'profile': echo json_encode($userController->updateProfile($userData['user_id'], $data)); break;
        case 'student-profile': echo json_encode($studentProfileController->createOrUpdateProfile($userData['user_id'], $data)); break;
        default: echo json_encode(["status" => 404, "message" => "Endpoint không hợp lệ"]); break;
    }
}

function handleUserDeleteRequests($endpoint, $id) {
    global $authMiddleware, $studentProfileController;
    
    if ($endpoint === 'student-profile') {
        $userData = $authMiddleware->isAuthenticated();
        echo json_encode($userData ?
            $studentProfileController->deleteProfile($userData['user_id']) :
            ["status" => 401, "message" => ERROR_UNAUTHORIZED]);
    } else {
        echo json_encode(["status" => 404, "message" => "Endpoint không hợp lệ"]);
    }
}

function handleAdminRoutes() {
    global $request_method, $url_parts, $data;
    
    switch ($request_method) {
        case 'GET': handleAdminGetRequests(); break;
        case 'POST': handleAdminPostRequests(); break;
        case 'PUT': handleAdminPutRequests(); break;
        case 'DELETE': handleAdminDeleteRequests(); break;
        default: echo json_encode(["status" => "error", "message" => "Request method không hợp lệ"]); break;
    }
}

function handleAdminGetRequests() {
    global $authMiddleware, $adminController, $url_parts;
    
    $userData = $authMiddleware->isAdmin();
    if (!$userData) {
        echo json_encode(["status" => 403, "message" => "Không có quyền truy cập admin"]);
        return;
    }
    
    $admin_index = array_search('admin', $url_parts);
    $segments = array_slice($url_parts, $admin_index + 1);
    
    if (empty($segments)) {
        echo json_encode(["status" => 404, "message" => "Admin endpoint không hợp lệ"]);
        return;
    }
    
    $endpoint = $segments[0];
    
    switch ($endpoint) {
        case 'topics':
            $result = $adminController->getAllTopicsForAdmin();
            break;
        case 'lessons':
            if (count($segments) >= 3 && is_numeric($segments[1]) && $segments[2] === 'vocabulary') {
                $lesson_id = intval($segments[1]);
                $page = intval($_GET['page'] ?? 1);
                $limit = intval($_GET['limit'] ?? 50);
                
                if (isset($_GET['keyword'])) {
                    $keyword = $_GET['keyword'];
                    $result = $adminController->searchLessonVocabulary($lesson_id, $keyword, $page, $limit);
                } else {
                    $result = $adminController->getLessonVocabularyForAdmin($lesson_id, $page, $limit);
                }
            } else {
                $result = $adminController->getAllLessonsForAdmin();
            }
            break;
        case 'statistics':
            $result = $adminController->getAdminStatistics();
            break;
            
        case 'search-vocabulary':
            if (isset($_GET['keyword'])) {
                $keyword = $_GET['keyword'];
                $page = intval($_GET['page'] ?? 1);
                $limit = intval($_GET['limit'] ?? 10);
                $result = $adminController->searchExistingVocabulary($keyword, $page, $limit);
            } else {
                $result = ["status" => 400, "message" => "Thiếu từ khóa tìm kiếm"];
            }
            break;
            
        default:
            $result = ["status" => 404, "message" => "Admin endpoint không tìm thấy: " . $endpoint];
            break;
    }
    
    http_response_code($result['status']);
    echo json_encode($result);
}

function handleAdminPostRequests() {
    global $authMiddleware, $adminController, $url_parts, $data;
    
    $userData = $authMiddleware->isAdmin();
    if (!$userData) {
        echo json_encode(["status" => 403, "message" => "Không có quyền truy cập admin"]);
        return;
    }
    
    $admin_index = array_search('admin', $url_parts);
    $segments = array_slice($url_parts, $admin_index + 1);
    
    if (empty($segments)) {
        echo json_encode(["status" => 404, "message" => "Admin endpoint không hợp lệ"]);
        return;
    }
    
    $endpoint = $segments[0];
    
    switch ($endpoint) {
        case 'topics': 
            $result = $adminController->createTopic($data); 
            break;
        case 'lessons': 
            $result = $adminController->createLesson($data); 
            break;
        case 'lesson-vocabulary': 
            $result = $adminController->addVocabularyToLesson($data); 
            break;
            
        // FIX: Add existing vocabulary to lesson
        case 'add-existing-vocabulary':
            if (isset($data['lesson_id']) && isset($data['vocab_id'])) {
                $result = $adminController->addExistingVocabularyToLesson($data['lesson_id'], $data['vocab_id']);
            } else {
                $result = ["status" => 400, "message" => "Thiếu lesson_id hoặc vocab_id"];
            }
            break;
            
        case 'upload-audio':
            $result = isset($data['audio_data']) ?
                $adminController->uploadAudioFile($data['audio_data'], $data['filename'] ?? null) :
                ["status" => 400, "message" => "Thiếu dữ liệu audio"];
            break;
        default: 
            $result = ["status" => 404, "message" => "Admin POST endpoint không hợp lệ"]; 
            break;
    }
    
    http_response_code($result['status']);
    echo json_encode($result);
}

function handleAdminPutRequests() {
    global $authMiddleware, $adminController, $url_parts, $data;
    
    $userData = $authMiddleware->isAdmin();
    if (!$userData) {
        echo json_encode(["status" => 403, "message" => "Không có quyền truy cập admin"]);
        return;
    }
    
    $admin_index = array_search('admin', $url_parts);
    $segments = array_slice($url_parts, $admin_index + 1);
    
    if (empty($segments)) {
        echo json_encode(["status" => 404, "message" => "Admin endpoint không hợp lệ"]);
        return;
    }
    
    $endpoint = $segments[0];
    
    switch ($endpoint) {
        case 'topics':
            $id = isset($segments[1]) && is_numeric($segments[1]) ? intval($segments[1]) : null;
            $result = $id ? $adminController->updateTopic($id, $data) : ["status" => 400, "message" => "Thiếu topic ID"];
            break;
        case 'lessons':
            $id = isset($segments[1]) && is_numeric($segments[1]) ? intval($segments[1]) : null;
            $result = $id ? $adminController->updateLesson($id, $data) : ["status" => 400, "message" => "Thiếu lesson ID"];
            break;
        case 'lesson-vocabulary':
            if (count($segments) >= 3 && is_numeric($segments[1]) && is_numeric($segments[2])) {
                $lesson_id = intval($segments[1]);
                $vocab_id = intval($segments[2]);
                $result = $adminController->updateLessonVocabulary($lesson_id, $vocab_id, $data);
            } else {
                $result = ["status" => 400, "message" => "Thiếu lesson_id hoặc vocab_id"];
            }
            break;
        default: $result = ["status" => 404, "message" => "Admin PUT endpoint không hợp lệ"]; break;
    }
    
    http_response_code($result['status']);
    echo json_encode($result);
}

function handleAdminDeleteRequests() {
    global $authMiddleware, $adminController, $url_parts;
    
    $userData = $authMiddleware->isAdmin();
    if (!$userData) {
        echo json_encode(["status" => 403, "message" => "Không có quyền truy cập admin"]);
        return;
    }
    
    $admin_index = array_search('admin', $url_parts);
    $segments = array_slice($url_parts, $admin_index + 1);
    
    if (empty($segments)) {
        echo json_encode(["status" => 404, "message" => "Admin endpoint không hợp lệ"]);
        return;
    }
    
    $endpoint = $segments[0];
    
    switch ($endpoint) {
        case 'topics':
            $id = isset($segments[1]) && is_numeric($segments[1]) ? intval($segments[1]) : null;
            $result = $id ? $adminController->deleteTopic($id) : ["status" => 400, "message" => "Thiếu topic ID"];
            break;
        case 'lessons':
            $id = isset($segments[1]) && is_numeric($segments[1]) ? intval($segments[1]) : null;
            $result = $id ? $adminController->deleteLesson($id) : ["status" => 400, "message" => "Thiếu lesson ID"];
            break;
        case 'lesson-vocabulary':
            if (count($segments) >= 3 && is_numeric($segments[1]) && is_numeric($segments[2])) {
                $lesson_id = intval($segments[1]);
                $vocab_id = intval($segments[2]);
                $result = $adminController->removeLessonVocabulary($lesson_id, $vocab_id);
            } else {
                $result = ["status" => 400, "message" => "Thiếu lesson_id hoặc vocab_id"];
            }
            break;
        default: $result = ["status" => 404, "message" => "Admin DELETE endpoint không hợp lệ"]; break;
    }
    
    http_response_code($result['status']);
    echo json_encode($result);
}
?>