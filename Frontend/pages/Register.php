<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Đăng ký - Flameo English</title>
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
                    <h1>Đăng ký tài khoản Flameo</h1>
                    
                    <div id="register-message" class="message"></div>
                    
                    <form id="registerForm">
                        <div class="form-group">
                            <label for="email">E-mail <span class="required">*</span></label>
                            <div class="input-group">
                                <input type="email" id="email" name="email" placeholder="example@email.com" required>
                                <span class="input-icon">
                                    <i class="fas fa-envelope"></i>
                                </span>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="display_name">Tên hiển thị</label>
                            <div class="input-group">
                                <input type="text" id="display_name" name="display_name" placeholder="Flameos">
                                <span class="input-icon">
                                    <i class="fas fa-user"></i>
                                </span>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="password">Mật khẩu <span class="required">*</span></label>
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
                            <button type="submit" class="btn btn-primary btn-block">Đăng ký</button>
                        </div>
                        
                        <div class="divider">
                            <span>hoặc đăng ký với</span>
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
                            <p>Đã có tài khoản? <a href="login.php">Đăng nhập</a></p>
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
        
        const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
        const confirmPasswordInput = document.getElementById('confirm_password');
        toggleConfirmPassword.addEventListener('click', function() {
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
        
        // Xử lý form đăng ký
        document.getElementById('registerForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirm_password = document.getElementById('confirm_password').value;
            const display_name = document.getElementById('display_name').value;
            const messageElement = document.getElementById('register-message');
            
            // Kiểm tra mật khẩu khớp nhau
            if (password !== confirm_password) {
                messageElement.className = 'message error';
                messageElement.textContent = 'Mật khẩu xác nhận không khớp';
                return;
            }
            
            try {
                const response = await fetch('/backend/api.php/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password,
                        display_name: display_name
                    })
                });
                
                const data = await response.json();
                
                if (data.status === 201) {
                    // Đăng ký thành công
                    messageElement.className = 'message success';
                    messageElement.textContent = data.message + ' Đang chuyển hướng đến trang đăng nhập...';
                    
                    // Chuyển hướng về trang đăng nhập sau 2 giây
                    setTimeout(() => {
                        window.location.href = 'login.php';
                    }, 2000);
                } else {
                    // Hiển thị thông báo lỗi
                    messageElement.className = 'message error';
                    messageElement.textContent = data.message || 'Đăng ký không thành công';
                }
            } catch (error) {
                console.error('Lỗi khi đăng ký:', error);
                messageElement.className = 'message error';
                messageElement.textContent = 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.';
            }
        });
    });
    </script>
</body>
</html>