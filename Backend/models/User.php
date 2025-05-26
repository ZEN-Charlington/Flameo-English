<?php
    class User {
        private $conn;
        private $table = 'Users';

        // Các thuộc tính
        public $user_id;
        public $email;
        public $password;
        public $display_name;
        public $role;
        public $created_at;
        public $reset_token;  // Thêm trường mới
        public $reset_token_expiry;  // Thêm trường mới

        public function __construct($db) {
            $this->conn = $db;
        }

        // Tạo người dùng mới
        public function create() {
            $query = "INSERT INTO " . $this->table . " SET
                    email = :email,
                    password = :password,
                    display_name = :display_name,
                    role = :role";

            $stmt = $this->conn->prepare($query);

            // Làm sạch dữ liệu
            $this->email = htmlspecialchars(strip_tags($this->email));
            $this->password = password_hash($this->password, PASSWORD_DEFAULT);
            $this->display_name = htmlspecialchars(strip_tags($this->display_name));
            $this->role = htmlspecialchars(strip_tags($this->role));

            // Bind dữ liệu
            $stmt->bindParam(':email', $this->email);
            $stmt->bindParam(':password', $this->password);
            $stmt->bindParam(':display_name', $this->display_name);
            $stmt->bindParam(':role', $this->role);

            // Thực thi query
            if($stmt->execute()) {
                return $this->conn->lastInsertId();
            }

            return false;
        }

        // Đăng nhập
        public function login() {
            $query = "SELECT * FROM " . $this->table . " WHERE email = :email";
            $stmt = $this->conn->prepare($query);
            
            $this->email = htmlspecialchars(strip_tags($this->email));
            
            $stmt->bindParam(':email', $this->email);
            $stmt->execute();
            
            return $stmt;
        }

        // Lấy thông tin người dùng theo ID
        public function getUserById() {
            $query = "SELECT * FROM " . $this->table . " WHERE user_id = :user_id";
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':user_id', $this->user_id);
            $stmt->execute();
            
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if($row) {
                $this->user_id = $row['user_id'];
                $this->email = $row['email'];
                $this->display_name = $row['display_name'];
                $this->role = $row['role'];
                $this->created_at = $row['created_at'];
                $this->reset_token = $row['reset_token'];  // Lấy giá trị reset_token
                $this->reset_token_expiry = $row['reset_token_expiry'];  // Lấy giá trị reset_token_expiry
                return true;
            }
            
            return false;
        }

        // Cập nhật thông tin
        public function update() {
            $query = "UPDATE " . $this->table . " SET
                    display_name = :display_name
                    WHERE user_id = :user_id";

            $stmt = $this->conn->prepare($query);

            $this->display_name = htmlspecialchars(strip_tags($this->display_name));
            $this->user_id = htmlspecialchars(strip_tags($this->user_id));

            $stmt->bindParam(':display_name', $this->display_name);
            $stmt->bindParam(':user_id', $this->user_id);

            if($stmt->execute()) {
                return true;
            }
            
            return false;
        }

        // Tạo reset token
        public function generateResetToken() {
            $token = bin2hex(random_bytes(32)); // Tạo token ngẫu nhiên 64 ký tự
            $expiry = date('Y-m-d H:i:s', strtotime('+1 hour')); // Hết hạn sau 1 giờ
            
            $query = "UPDATE " . $this->table . " SET 
                    reset_token = :reset_token,
                    reset_token_expiry = :reset_token_expiry
                    WHERE email = :email";
            
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':reset_token', $token);
            $stmt->bindParam(':reset_token_expiry', $expiry);
            $stmt->bindParam(':email', $this->email);
            
            if($stmt->execute()) {
                return $token;
            }
            
            return false;
        }
        
        // Kiểm tra token reset password có hợp lệ không
        public function verifyResetToken($token) {
            $query = "SELECT user_id, email FROM " . $this->table . " 
                    WHERE reset_token = :reset_token
                    AND reset_token_expiry > NOW()";
            
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':reset_token', $token);
            $stmt->execute();
            
            if($stmt->rowCount() > 0) {
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                $this->user_id = $row['user_id'];
                $this->email = $row['email'];
                return true;
            }
            
            return false;
        }
        
        // Đặt lại mật khẩu
        public function resetPassword($newPassword) {
            $query = "UPDATE " . $this->table . " SET 
                    password = :password,
                    reset_token = NULL,
                    reset_token_expiry = NULL
                    WHERE user_id = :user_id";
            
            $stmt = $this->conn->prepare($query);
            
            $hashed_password = password_hash($newPassword, PASSWORD_DEFAULT);
            
            $stmt->bindParam(':password', $hashed_password);
            $stmt->bindParam(':user_id', $this->user_id);
            
            return $stmt->execute();
        }
        public function generateResetOTP() {
            date_default_timezone_set('Asia/Ho_Chi_Minh');
            
            $otp = sprintf('%06d', mt_rand(0, 999999));
            $expiry = date('Y-m-d H:i:s', strtotime('+15 minutes'));
            
            $query = "UPDATE " . $this->table . " SET 
                    reset_token = :reset_token,
                    reset_token_expiry = :reset_token_expiry
                    WHERE email = :email";
            
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':reset_token', $otp);
            $stmt->bindParam(':reset_token_expiry', $expiry);
            $stmt->bindParam(':email', $this->email);
            
            if($stmt->execute()) {
                return $otp;
            }
            
            return false;
        }

        // Kiểm tra OTP có hợp lệ không
        public function verifyResetOTP($otp) {
            $query = "SELECT user_id, email FROM " . $this->table . " 
                    WHERE reset_token = :reset_token
                    AND reset_token_expiry > NOW()";
            
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':reset_token', $otp);
            $stmt->execute();
            
            if($stmt->rowCount() > 0) {
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                $this->user_id = $row['user_id'];
                $this->email = $row['email'];
                return true;
            }
            
            return false;
        }

        // Kiểm tra mật khẩu mới có trùng mật khẩu cũ không
        public function checkCurrentPassword($password) {
            $query = "SELECT password FROM " . $this->table . " WHERE user_id = :user_id";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $this->user_id);
            $stmt->execute();
            
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if($row && password_verify($password, $row['password'])) {
                return true;
            }
            
            return false;
        }

        // Đặt lại mật khẩu với OTP
        public function resetPasswordWithOTP($newPassword) {
            $query = "UPDATE " . $this->table . " SET 
                    password = :password,
                    reset_token = NULL,
                    reset_token_expiry = NULL
                    WHERE user_id = :user_id";
            
            $stmt = $this->conn->prepare($query);
            
            $hashed_password = password_hash($newPassword, PASSWORD_DEFAULT);
            
            $stmt->bindParam(':password', $hashed_password);
            $stmt->bindParam(':user_id', $this->user_id);
            
            return $stmt->execute();
        }


        
        // Tìm người dùng theo email
        public function findByEmail() {
            $query = "SELECT * FROM " . $this->table . " WHERE email = :email";
            $stmt = $this->conn->prepare($query);
            
            $stmt->bindParam(':email', $this->email);
            $stmt->execute();
            
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if($row) {
                $this->user_id = $row['user_id'];
                $this->email = $row['email'];
                $this->display_name = $row['display_name'];
                $this->role = $row['role'];
                return true;
            }
            
            return false;
        }
    }
?>