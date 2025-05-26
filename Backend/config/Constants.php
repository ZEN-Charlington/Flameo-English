<?php
// config/Constants.php
// Quản lý các hằng số và cấu hình cho ứng dụng

// Cấu hình JWT
define('JWT_SECRET_KEY', 'solarytear'); // Thay bằng key phức tạp và an toàn
define('JWT_ISSUER', 'flameo_english');
define('JWT_AUDIENCE', 'flameo_users');
define('JWT_EXPIRATION_TIME', 4 * 60 * 60); // 4 giờ (tính bằng giây)

// Các cấu hình khác
define('DEFAULT_DISPLAY_NAME', 'Flameos');
define('DEFAULT_ROLE', 'Student');


// Các thông báo lỗi
define('ERROR_EMAIL_PASSWORD_REQUIRED', 'Email và mật khẩu không được để trống');
define('ERROR_INVALID_EMAIL', 'Email không hợp lệ');
define('ERROR_LOGIN_FAILED', 'Email hoặc mật khẩu không đúng');
define('ERROR_UNAUTHORIZED', 'Yêu cầu xác thực');
define('ERROR_INVALID_TOKEN', 'Token không hợp lệ hoặc đã hết hạn');
define('ERROR_EMAIL_NOT_FOUND', 'Email không tồn tại trong hệ thống');
define('ERROR_WRONG_PASSWORD', 'Mật khẩu không chính xác');
?>