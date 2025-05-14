// Phiên bản tối ưu của navbar-auth.js và auth-navbar.js

// Kiểm tra đăng nhập và cập nhật phần user
document.addEventListener('DOMContentLoaded', function() {
    const userSection = document.getElementById('user-section');
    if (!userSection) return; // Đảm bảo phần tử tồn tại
    
    // Tránh reflow và repaint liên tục
    const fragment = document.createDocumentFragment();
    const div = document.createElement('div');
    
    // Kiểm tra token từ localStorage
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const baseUrl = '/frontend'; // Đường dẫn tuyệt đối
    
    if (token && userData) {
        // Đã đăng nhập - Chuẩn bị nội dung
        div.className = 'user-info';
        div.innerHTML = `
            <p class="welcome-text">Xin chào, ${userData.display_name || 'Flameos'}!</p>
            <div class="user-dropdown">
                <img class="avatar" src="${baseUrl}/assets/AppAvatar.png">
                <div class="dropdown-content">
                    <a href="${baseUrl}/Pages/profile.php">Thông tin cá nhân</a>
                    <a href="${baseUrl}/Pages/settings.php">Cài đặt</a>
                    <a href="#" id="logout-btn">Đăng xuất</a>
                </div>
            </div>
        `;
        
        // Thêm vào DOM
        fragment.appendChild(div);
        userSection.innerHTML = '';
        userSection.appendChild(fragment);
        
        // Thêm sự kiện đăng xuất - Chuyển đến trang login khi đăng xuất
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Hiển thị loading trước khi chuyển hướng
                const loader = document.createElement('div');
                loader.className = 'page-transition-loader';
                document.body.appendChild(loader);
                setTimeout(() => {
                    loader.style.opacity = '1';
                    
                    // Xóa token và chuyển hướng
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = `${baseUrl}/Pages/login.php`;
                }, 10);
            });
        }
    } else {
        // Chưa đăng nhập - Chuẩn bị nội dung
        div.className = 'auth-buttons';
        div.innerHTML = `
            <a href="${baseUrl}/Pages/login.php" class="btn-login">Đăng nhập</a>
            <a href="${baseUrl}/Pages/register.php" class="btn-register">Đăng ký</a>
        `;
        
        // Thêm vào DOM
        fragment.appendChild(div);
        userSection.innerHTML = '';
        userSection.appendChild(fragment);
    }
    
    // Kiểm tra kích thước màn hình và tình trạng đăng nhập
    function checkScreenSize() {
        if (window.innerWidth <= 576 && !token) {
            userSection.classList.add('has-auth-buttons');
        } else {
            userSection.classList.remove('has-auth-buttons');
        }
    }
    
    checkScreenSize();
    
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(checkScreenSize, 100);
    });
});