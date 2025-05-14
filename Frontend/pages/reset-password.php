<?php
// Lấy token từ URL
$token = isset($_GET['token']) ? $_GET['token'] : '';
if(empty($token)) {
    header('Location: login.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đặt lại mật khẩu - Flameo English</title>
    <link rel="icon" type="image/png" href="../assets/AppAvatar.png">
    <link rel="stylesheet" href="../Style/auth.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-left">
                <div class="logo">
                    <a href="../index.php">
                        <h1>FLAMEO</h1>
                    </a>
                </div>
                
                <div class="auth-content">
                    <h2>Bảo mật tài khoản</h2>
                    <h1>Đặt lại mật khẩu</h1>
                    
                    <div id="reset-message" class="message"></div>
                    
                    <form id="resetPasswordForm">
                        <input type="hidden" id="token" name="token" value="<?php echo htmlspecialchars($token); ?>">
                        
                        <div class="form-group">
                            <label for="password">Mật khẩu mới <span class="required">*</span></label>
                            <div class="input-group">
                                <input type="password" id="password" name="password" placeholder="••••••••" required minlength="6">
                                <span class="input-icon password-toggle">
                                    <i class="fas fa-eye" id="togglePassword"></i>
                                </span>
                            </div>
                            <small>Mật khẩu ít nhất 6 ký tự</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="confirm_password">Xác nhận mật khẩu <span class="required">*</span></label>
                            <div class="input-group">
                                <input type="password" id="confirm_password" name="confirm_password" placeholder="••••••••" required minlength="6">
                                <span class="input-icon password-toggle">
                                    <i class="fas fa-eye" id="toggleConfirmPassword"></i>
                                </span>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <button type="submit" class="btn btn-primary btn-block">Đặt lại mật khẩu</button>
                        </div>
                        
                        <div class="auth-footer">
                            <p><a href="login.php"><i class="fas fa-arrow-left"></i> Quay lại đăng nhập</a></p>
                        </div>
                    </form>
                </div>
            </div>
            
            <div class="auth-right">
                <!-- Hình nền gradient màu xanh dương và hồng, sẽ được tạo bằng CSS -->
            </div>
        </div>
    </div>
    
    <script src="../js/auth.js"></script>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        // Xác thực token khi trang tải
        verifyToken();
        
        // Toggle hiển thị mật khẩu
        const togglePassword = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('password');
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
        
        const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
        const confirmPasswordInput = document.getElementById('confirm_password');
        toggleConfirmPassword.addEventListener('click', function() {
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
        
        // Xác thực token
        async function verifyToken() {
            const token = document.getElementById('token').value;
            const messageElement = document.getElementById('reset-message');
            const form = document.getElementById('resetPasswordForm');
            
            try {
                const response = await fetch(`/backend/api.php/verify-reset-token/${token}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (!data.valid) {
                    messageElement.className = 'message error';
                    messageElement.textContent = 'Liên kết đặt lại
                    messageElement.className = 'message error';
                    messageElement.textContent = 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu liên kết mới.';
                    form.style.display = 'none';
                }
            } catch (error) {
                console.error('Lỗi khi xác thực token:', error);
                messageElement.className = 'message error';
                messageElement.textContent = 'Đã xảy ra lỗi khi xác thực liên kết. Vui lòng thử lại sau.';
                form.style.display = 'none';
            }
        }
       
       // Xử lý form đặt lại mật khẩu
        document.getElementById('resetPasswordForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const token = document.getElementById('token').value;
            const password = document.getElementById('password').value;
            const confirm_password = document.getElementById('confirm_password').value;
            const messageElement = document.getElementById('reset-message');
            
            // Kiểm tra mật khẩu khớp nhau
            if (password !== confirm_password) {
                messageElement.className = 'message error';
                messageElement.textContent = 'Mật khẩu xác nhận không khớp';
                return;
            }
            
            try {
                const response = await fetch('/backend/api.php/reset-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        token: token,
                        password: password
                    })
                });
                
                const data = await response.json();
                
                if (data.status === 200) {
                    // Đặt lại mật khẩu thành công
                    messageElement.className = 'message success';
                    messageElement.textContent = data.message;
                    
                    // Chuyển hướng về trang đăng nhập sau 3 giây
                    setTimeout(() => {
                        window.location.href = 'login.php';
                    }, 3000);
                } else {
                    // Hiển thị thông báo lỗi
                    messageElement.className = 'message error';
                    messageElement.textContent = data.message || 'Không thể đặt lại mật khẩu';
                }
            } catch (error) {
                console.error('Lỗi khi đặt lại mật khẩu:', error);
                messageElement.className = 'message error';
                messageElement.textContent = 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
            }
        });
    });
    </script>
</body>
</html>