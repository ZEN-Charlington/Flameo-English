<?php
// backend/api.php
// API Router chính

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Thời gian thực thi API không giới hạn (tùy chỉnh nếu cần)
set_time_limit(0);

// Include các file cần thiết
include_once 'config/Database.php';
include_once 'config/Constants.php';
include_once 'models/User.php';
include_once 'models/StudentProfile.php';
include_once 'controllers/AuthController.php';
include_once 'controllers/UserController.php';
include_once 'controllers/AuthMiddleware.php';
include_once 'controllers/PasswordResetController.php';

// Kết nối database
$database = new Database();
$db = $database->getConnection();

// Lấy HTTP method
$method = $_SERVER['REQUEST_METHOD'];

// Phân tích URI để lấy endpoint
$request_uri = $_SERVER['REQUEST_URI'];

// Lấy phần sau /backend/api.php/ trong URL
if (strpos($request_uri, '/backend/api.php/') !== false) {
    $uri_parts = explode('/backend/api.php/', $request_uri);
    if (count($uri_parts) > 1) {
        $path_info = $uri_parts[1];
        $request = explode('/', trim($path_info, '/'));
    } else {
        $request = [];
    }
} else {
    // Thử phương pháp khác nếu định dạng URL khác
    $request = isset($_SERVER['PATH_INFO']) ? explode('/', trim($_SERVER['PATH_INFO'], '/')) : [];
}

// API endpoints
$endpoint = $request[0] ?? '';
$subEndpoint = $request[1] ?? '';

// Lấy dữ liệu từ request
$data = json_decode(file_get_contents("php://input"), true);

// Khởi tạo các controller
$authController = new AuthController($db);
$userController = new UserController($db);
$authMiddleware = new AuthMiddleware($authController);
$passwordResetController = new PasswordResetController($db);

// Debug mode - Bỏ comment dòng dưới để debug đường dẫn
// echo json_encode(['request_uri' => $request_uri, 'endpoint' => $endpoint, 'subEndpoint' => $subEndpoint, 'request' => $request]);
// exit;

// Xử lý API
switch($endpoint) {
    case 'register':
        if($method === 'POST') {
            $result = $authController->register($data);
            http_response_code($result['status']);
            echo json_encode($result);
        } else {
            http_response_code(405);
            echo json_encode(['message' => 'Phương thức không được hỗ trợ']);
        }
        break;
        
    case 'login':
        if($method === 'POST') {
            $result = $authController->login($data);
            http_response_code($result['status']);
            echo json_encode($result);
        } else {
            http_response_code(405);
            echo json_encode(['message' => 'Phương thức không được hỗ trợ']);
        }
        break;
    
    case 'verify-token':
        if($method === 'GET') {
            $headers = getallheaders();
            $auth = isset($headers['Authorization']) ? $headers['Authorization'] : '';
            
            if(strpos($auth, 'Bearer ') === 0) {
                $token = substr($auth, 7);
                $userData = $authController->validateToken($token);
                
                if($userData) {
                    // Token hợp lệ, kiểm tra thời hạn
                    $expiration = $authController->checkTokenExpiration($token);
                    
                    echo json_encode([
                        'status' => 200,
                        'valid' => true,
                        'expiration' => $expiration,
                        'user_id' => $userData['user_id'],
                        'email' => $userData['email'],
                        'role' => $userData['role']
                    ]);
                } else {
                    // Token không hợp lệ hoặc đã hết hạn
                    echo json_encode([
                        'status' => 401,
                        'valid' => false,
                        'message' => ERROR_INVALID_TOKEN
                    ]);
                }
            } else {
                echo json_encode([
                    'status' => 400,
                    'valid' => false,
                    'message' => 'Không tìm thấy token'
                ]);
            }
        } else {
            http_response_code(405);
            echo json_encode(['message' => 'Phương thức không được hỗ trợ']);
        }
        break;
        
    case 'user':
        // Kiểm tra token
        $userData = $authMiddleware->isAuthenticated();
        
        if($userData) {
            $user_id = $userData['user_id'];
            
            // Xử lý các sub-endpoints của user
            if($subEndpoint === '') {
                // /user - Thông tin cơ bản
                if($method === 'GET') {
                    $result = $userController->getUserInfo($user_id);
                    http_response_code($result['status']);
                    echo json_encode($result);
                } else if($method === 'PUT') {
                    // Cập nhật display_name
                    $result = $userController->updateUserInfo($user_id, $data);
                    http_response_code($result['status']);
                    echo json_encode($result);
                } else {
                    http_response_code(405);
                    echo json_encode(['message' => 'Phương thức không được hỗ trợ']);
                }
            } else if($subEndpoint === 'profile') {
                // /user/profile - Thông tin cá nhân
                if($method === 'PUT') {
                    // Cập nhật hoặc tạo mới profile
                    $result = $userController->updateProfile($user_id, $data);
                    http_response_code($result['status']);
                    echo json_encode($result);
                } else {
                    http_response_code(405);
                    echo json_encode(['message' => 'Phương thức không được hỗ trợ']);
                }
            } else {
                http_response_code(404);
                echo json_encode(['message' => 'API endpoint không tồn tại']);
            }
        } else {
            http_response_code(401);
            echo json_encode(['message' => ERROR_UNAUTHORIZED]);
        }
        break;
    case 'forgot-password':
        if($method === 'POST') {
            $result = $passwordResetController->forgotPassword($data);
            http_response_code($result['status']);
            echo json_encode($result);
        } else {
            http_response_code(405);
            echo json_encode(['message' => 'Phương thức không được hỗ trợ']);
        }
        break;
    
    case 'verify-reset-token':
        if($method === 'GET' && isset($request[1])) {
            $token = $request[1];
            $result = $passwordResetController->verifyToken($token);
            http_response_code($result['status']);
            echo json_encode($result);
        } else {
            http_response_code(400);
            echo json_encode(['message' => 'Token không hợp lệ']);
        }
        break;
    
    case 'reset-password':
        if($method === 'POST') {
            $result = $passwordResetController->resetPassword($data);
            http_response_code($result['status']);
            echo json_encode($result);
        } else {
            http_response_code(405);
            echo json_encode(['message' => 'Phương thức không được hỗ trợ']);
        }
        break;
    default:
        // Nếu không có endpoint hoặc endpoint không hợp lệ
        if (empty($endpoint)) {
            // Trả về thông tin API nếu gọi trực tiếp đến api.php
            echo json_encode([
                'status' => 200,
                'message' => 'Flameo English API',
                'version' => '1.0.0',
                'endpoints' => [
                    'register', 'login', 'verify-token', 'user', 
                    'forgot-password', 'verify-reset-token', 'reset-password'
                ]
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['message' => 'API endpoint không tồn tại']);
        }
        break;
}
?>