<?php
// controllers/AuthMiddleware.php
// Middleware kiểm tra token và phân quyền

class AuthMiddleware {
    private $authController;
    
    public function __construct($authController) {
        $this->authController = $authController;
    }
    
    // Kiểm tra xác thực
    public function isAuthenticated() {
        $headers = getallheaders();
        $auth = isset($headers['Authorization']) ? $headers['Authorization'] : '';
        
        if(strpos($auth, 'Bearer ') === 0) {
            $token = substr($auth, 7);
            $userData = $this->authController->validateToken($token);
            
            if($userData) {
                return $userData;
            }
        }
        
        return false;
    }
    
    // Kiểm tra quyền admin
    public function isAdmin() {
        $userData = $this->isAuthenticated();
        
        if($userData && $userData['role'] === 'Admin') {
            return $userData;
        }
        
        return false;
    }
}
?>