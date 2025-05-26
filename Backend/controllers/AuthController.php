<?php
// controllers/AuthController.php
// Controller xử lý đăng ký, đăng nhập

require_once 'config/Constants.php';

class AuthController {
    private $db;
    private $user;

    public function __construct($db) {
        $this->db = $db;
        $this->user = new User($db);
    }
    // Đăng ký tài khoản mới (chỉ tạo User, không tạo StudentProfile)
    public function register($data) {
        // Kiểm tra dữ liệu đầu vào
        if(empty($data['email']) || empty($data['password'])) {
            return [
                'status' => 400,
                'message' => 'ERROR_EMAIL_PASSWORD_REQUIRED'
            ];
        }

        // Kiểm tra định dạng email
        if(!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return [
                'status' => 400,
                'message' => ERROR_INVALID_EMAIL
            ];
        }

        // Thiết lập dữ liệu cho user
        $this->user->email = $data['email'];
        $this->user->password = $data['password'];
        $this->user->display_name = !empty($data['display_name']) ? $data['display_name'] : DEFAULT_DISPLAY_NAME;
        $this->user->role = DEFAULT_ROLE;

        // Tạo tài khoản
        $user_id = $this->user->create();
        
        if($user_id) {
            return [
                'status' => 201,
                'message' => 'Đăng ký thành công',
                'user_id' => $user_id
            ];
        }
        
        return [
            'status' => 500,
            'message' => 'Đăng ký không thành công'
        ];
    }

    public function login($data) {
        if(empty($data['email']) || empty($data['password'])) {
            return [
                'status' => 400,
                'message' => ERROR_EMAIL_PASSWORD_REQUIRED
            ];
        }

        // Thiết lập email
        $this->user->email = $data['email'];
        
        // Kiểm tra email có tồn tại không
        $result = $this->user->login();
        $user = $result->fetch(PDO::FETCH_ASSOC);

        // Kiểm tra email không tồn tại
        if(!$user) {
            return [
                'status' => 404,
                'message' => 'Email không tồn tại trong hệ thống'
            ];
        }
        
        // Kiểm tra password
        if(!password_verify($data['password'], $user['password'])) {
            return [
                'status' => 401,
                'message' => 'Mật khẩu không chính xác'
            ];
        }
        
        // Đăng nhập thành công
        $token = $this->generateJwt($user);
        
        return [
            'status' => 200,
            'message' => 'Đăng nhập thành công',
            'token' => $token,
            'user' => [
                'user_id' => $user['user_id'],
                'email' => $user['email'],
                'display_name' => $user['display_name'],
                'role' => $user['role']
            ]
        ];
    }

    // Tạo JWT Token với thời hạn 4 tiếng
    private function generateJwt($user) {
        $issuer = JWT_ISSUER;
        $audience = JWT_AUDIENCE;
        $issued_at = time();
        $expiration = $issued_at + JWT_EXPIRATION_TIME;
        
        $payload = [
            "iss" => $issuer,
            "aud" => $audience,
            "iat" => $issued_at,
            "exp" => $expiration,
            "data" => [
                "user_id" => $user['user_id'],
                "email" => $user['email'],
                "role" => $user['role']
            ]
        ];
        
        // Tạo header
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $header = base64_encode($header);
        
        // Tạo payload
        $payload = json_encode($payload);
        $payload = base64_encode($payload);
        
        // Tạo signature
        $signature = hash_hmac('sha256', "$header.$payload", JWT_SECRET_KEY, true);
        $signature = base64_encode($signature);
        
        // Kết hợp tạo JWT token
        $jwt = "$header.$payload.$signature";
        
        return $jwt;
    }

    // Xác thực JWT Token
    public function validateToken($token) {
        // Tách JWT thành 3 phần
        $parts = explode('.', $token);
        if(count($parts) != 3) {
            return false;
        }
        
        $header = base64_decode($parts[0]);
        $payload = base64_decode($parts[1]);
        $signature_provided = $parts[2];
        
        // Kiểm tra signature
        $signature = hash_hmac('sha256', "$parts[0].$parts[1]", JWT_SECRET_KEY, true);
        $signature = base64_encode($signature);
        
        if($signature !== $signature_provided) {
            return false;
        }
        
        // Kiểm tra hết hạn
        $payload = json_decode($payload, true);
        $now = time();
        
        if($payload['exp'] < $now) {
            return false;
        }
        
        return $payload['data'];
    }

    // Kiểm tra thời hạn token
    public function checkTokenExpiration($token) {
        $parts = explode('.', $token);
        if(count($parts) != 3) {
            return false;
        }
        
        $payload = base64_decode($parts[1]);
        $payload = json_decode($payload, true);
        $now = time();
        
        // Kiểm tra thời hạn token
        if($payload['exp'] < $now) {
            return [
                'expired' => true,
                'remaining' => 0
            ];
        }
        
        // Tính thời gian còn lại (giây)
        $remaining = $payload['exp'] - $now;
        
        return [
            'expired' => false,
            'remaining' => $remaining,
            'remaining_minutes' => ceil($remaining / 60),
            'remaining_hours' => ceil($remaining / 3600)
        ];
    }
}
?>