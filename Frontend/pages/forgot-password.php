<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quên mật khẩu - Flameo English</title>
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
                    <h2>Đặt lại mật khẩu</h2>
                    <h1>Quên mật khẩu?</h1>
                    <p class="subtext">Nhập email của bạn và chúng tôi sẽ gửi liên kết đặt lại mật khẩu</p>
                    
                    <div id="forgot-message" class="message"></div>
                    
                    <form id="forgotPasswordForm">
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
                            <button type="submit" class="btn btn-primary btn-block">Gửi liên kết đặt lại</button>
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
        // Xử lý form quên mật khẩu
        document.getElementById('forgotPasswordForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const messageElement = document.getElementById('forgot-message');
            
            try {
                const response = await fetch('/backend/api.php/forgot-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email
                    })
                });
                
                const data = await response.json();
                
                // Luôn hiển thị thông báo thành công để tránh rò rỉ thông tin
                messageElement.className = 'message success';
                messageElement.textContent = data.message;
                
                // Trong môi trường phát triển, hiển thị liên kết để dễ test
                if(data.dev_reset_link) {
                    const devInfo = document.createElement('div');
                    devInfo.innerHTML = `<p style="margin-top: 15px; font-size: 12px;">DEV MODE: <a href="${data.dev_reset_link}" target="_blank">Reset Link</a></p>`;
                    messageElement.appendChild(devInfo);
                }
            } catch (error) {
                console.error('Lỗi khi gửi yêu cầu:', error);
                messageElement.className = 'message error';
                messageElement.textContent = 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
            }
        });
    });
    </script>
</body>
</html>