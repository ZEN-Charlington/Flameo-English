<?php
// controllers/PasswordResetController.php
// Controller xử lý quên mật khẩu và đặt lại mật khẩu

class PasswordResetController {
    private $db;
    private $user;
    
    public function __construct($db) {
        $this->db = $db;
        $this->user = new User($db);
    }
    
    // Xử lý yêu cầu quên mật khẩu
    public function forgotPassword($data) {
        if(empty($data['email'])) {
            return [
                'status' => 400,
                'message' => 'Email không được để trống'
            ];
        }
        
        // Tìm người dùng theo email
        $this->user->email = $data['email'];
        
        if($this->user->findByEmail()) {
            // Tạo token reset password
            $token = $this->user->generateResetToken();
            
            if($token) {
                // Gửi email reset password (giả lập)
                $resetLink = $_SERVER['HTTP_ORIGIN'] . '/frontend/pages/reset-password.php?token=' . $token;
                
                // Trong môi trường thực tế, bạn sẽ gửi email thực sự, ví dụ:
                // $this->sendResetEmail($this->user->email, $this->user->display_name, $resetLink);
                
                return [
                    'status' => 200,
                    'message' => 'Liên kết đặt lại mật khẩu đã được gửi đến email của bạn.',
                    'dev_reset_link' => $resetLink // chỉ dùng cho môi trường phát triển
                ];
            }
        }
        
        // Không tìm thấy email hoặc có lỗi
        // Trả về thông báo chung để tránh rò rỉ thông tin
        return [
            'status' => 200, // Vẫn trả về 200 để tránh tiết lộ email tồn tại hay không
            'message' => 'Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu sẽ được gửi.'
        ];
    }
    
    // Xác thực token reset password
    public function verifyToken($token) {
        if($this->user->verifyResetToken($token)) {
            return [
                'status' => 200,
                'valid' => true,
                'message' => 'Token hợp lệ',
                'email' => $this->user->email
            ];
        }
        
        return [
            'status' => 400,
            'valid' => false,
            'message' => 'Token không hợp lệ hoặc đã hết hạn'
        ];
    }
    
    // Đặt lại mật khẩu
    public function resetPassword($data) {
        if(empty($data['token']) || empty($data['password'])) {
            return [
                'status' => 400,
                'message' => 'Token và mật khẩu mới không được để trống'
            ];
        }
        
        // Xác thực token
        if($this->user->verifyResetToken($data['token'])) {
            // Đặt lại mật khẩu
            if($this->user->resetPassword($data['password'])) {
                return [
                    'status' => 200,
                    'message' => 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập bằng mật khẩu mới.'
                ];
            }
        }
        
        return [
            'status' => 400,
            'message' => 'Không thể đặt lại mật khẩu. Token không hợp lệ hoặc đã hết hạn.'
        ];
    }
    
    // Gửi email đặt lại mật khẩu (môi trường thực tế)
    private function sendResetEmail($email, $name, $resetLink) {
        // Thiết lập tiêu đề
        $subject = 'Đặt lại mật khẩu Flameo English';
        
        // Nội dung email
        $message = '
        <html>
        <head>
            <title>Đặt lại mật khẩu Flameo English</title>
        </head>
        <body>
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #4a6fff;">FLAMEO</h1>
                </div>
                <div style="background: #f9f9f9; padding: 20px; border-radius: 5px;">
                    <h2>Xin chào ' . htmlspecialchars($name) . ',</h2>
                    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu Flameo English của bạn.</p>
                    <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                    <p>Để đặt lại mật khẩu, vui lòng nhấn vào liên kết dưới đây:</p>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="' . $resetLink . '" style="display: inline-block; padding: 12px 30px; background-color: #4a6fff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Đặt lại mật khẩu</a>
                    </p>
                    <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
                    <p>Nếu không nhấn được vào nút trên, bạn có thể sao chép và dán liên kết sau vào trình duyệt:</p>
                    <p style="word-break: break-all;">' . $resetLink . '</p>
                    <p>Trân trọng,<br>Đội ngũ Flameo English</p>
                </div>
                <div style="text-align: center; margin-top: 20px; color: #777; font-size: 12px;">
                    <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                </div>
            </div>
        </body>
        </html>';
        
        // Headers
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= "From: Flameo English <no-reply@flameo.com>" . "\r\n";
        
        // Gửi email
        mail($email, $subject, $message, $headers);
    }
}
?>