<?php
// Kiểm tra nếu có thông báo hết hạn
$expired_message = '';
if (isset($_GET['expired']) && $_GET['expired'] == 'true') {
    $expired_message = 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.';
} else if (isset($_GET['session_expired']) && $_GET['session_expired'] == 'true') {
    $expired_message = 'Phiên làm việc đã kết thúc. Vui lòng đăng nhập lại để tiếp tục.';
}
?>
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đăng nhập - Flameo English</title>
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
                    <h2>Bắt đầu hành trình của bạn</h2>
                    <h1>Đăng nhập vào Flameo</h1>

                    <?php if (!empty($expired_message)): ?>
                        <div class="alert alert-warning">
                            <?php echo $expired_message; ?>
                        </div>
                    <?php endif; ?>
                    
                    <div id="login-message" class="message"></div>
                    
                    <form id="loginForm">
                        <div class="form-group">
                            <label for="email">E-mail</label>
                            <div class="input-group">
                                <input type="email" id="email" name="email" placeholder="example@email.com" required>
                                <span class="input-icon">
                                    <i class="fas fa-envelope"></i>
                                </span>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="password">Mật khẩu</label>
                            <div class="input-group">
                                <input type="password" id="password" name="password" placeholder="••••••••" required>
                                <span class="input-icon password-toggle">
                                    <i class="fas fa-eye" id="togglePassword"></i>
                                </span>
                            </div>
                            <div class="forgot-password">
                                <a href="forgot-password.php">Quên mật khẩu?</a>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <button type="submit" class="btn btn-primary btn-block">Đăng nhập</button>
                        </div>
                        
                        <div class="divider">
                            <span>hoặc đăng nhập với</span>
                        </div>
                        
                        <div class="social-login">
                            <button type="button" class="btn btn-social btn-facebook">
                                <i class="fab fa-facebook-f"></i>
                            </button>
                            <button type="button" class="btn btn-social btn-google">
                                <i class="fab fa-google"></i>
                            </button>
                            <button type="button" class="btn btn-social btn-apple">
                                <i class="fab fa-apple"></i>
                            </button>
                        </div>
                        
                        <div class="auth-footer">
                            <p>Chưa có tài khoản? <a href="register.php">Đăng ký</a></p>
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
        // Toggle hiển thị mật khẩu
        const togglePassword = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('password');
        
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
        
        // Xử lý form đăng nhập
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const messageElement = document.getElementById('login-message');
            
            try {
                const response = await fetch('/backend/api.php/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                });
                
                const data = await response.json();
                
                if (data.status === 200) {
                    // Đăng nhập thành công, lưu token
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    // Hiển thị thông báo thành công
                    messageElement.className = 'message success';
                    messageElement.textContent = data.message;
                    
                    // Chuyển hướng về trang chính
                    setTimeout(() => {
                        window.location.href = '../index.php';
                    }, 1000);
                } else {
                    // Hiển thị thông báo lỗi
                    messageElement.className = 'message error';
                    messageElement.textContent = data.message || 'Đăng nhập không thành công';
                }
            } catch (error) {
                console.error('Lỗi khi đăng nhập:', error);
                messageElement.className = 'message error';
                messageElement.textContent = 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.';
            }
        });
    });
    </script>
</body>
</html>