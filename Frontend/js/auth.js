// frontend/js/auth.js
// Quản lý token và xác thực phía client

class AuthService {
    constructor() {
        this.token = localStorage.getItem('token');
        this.tokenTimer = null;
        
        // Kiểm tra token khi khởi tạo
        if (this.token) {
            this.verifyToken();
        }
    }
    
    // Lưu token sau khi đăng nhập
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
        
        // Thiết lập timer để kiểm tra token
        this.startTokenTimer();
    }
    
    // Xóa token khi đăng xuất hoặc hết hạn
    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        clearTimeout(this.tokenTimer);
        
        // Chuyển hướng về trang đăng nhập
        window.location.href = '/frontend/pages/login.php?session_expired=true';
    }
    
    // Lấy token hiện tại
    getToken() {
        return this.token;
    }
    
    // Kiểm tra trạng thái đăng nhập
    isLoggedIn() {
        return !!this.token;
    }
    
    // Kiểm tra và xác thực token
    async verifyToken() {
        try {
            const response = await fetch('/backend/api.php/verify-token', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.valid) {
                // Token hợp lệ, thiết lập timer để kiểm tra lại trước khi hết hạn
                const remainingTime = data.expiration.remaining * 1000; // Chuyển giây thành milli giây
                this.startTokenTimer(remainingTime);
                return true;
            } else {
                // Token không hợp lệ hoặc đã hết hạn
                this.clearToken();
                return false;
            }
        } catch (error) {
            console.error('Lỗi khi xác thực token:', error);
            return false;
        }
    }
    
    // Thiết lập timer kiểm tra token
    startTokenTimer(remainingTime = null) {
        // Xóa timer cũ nếu có
        if (this.tokenTimer) {
            clearTimeout(this.tokenTimer);
        }
        
        // Nếu không có thời gian còn lại, mặc định kiểm tra sau 1 giờ
        const checkTime = remainingTime || (1 * 60 * 60 * 1000);
        
        // Lưu lại thời gian hết hạn dự kiến
        const expirationTime = new Date().getTime() + checkTime;
        localStorage.setItem('tokenExpiration', expirationTime);
        
        // Thiết lập timer mới - kiểm tra trước 15 phút khi token sắp hết hạn
        const timeBeforeExpiration = Math.max(0, checkTime - (15 * 60 * 1000));
        
        this.tokenTimer = setTimeout(() => {
            // Kiểm tra và thông báo token sắp hết hạn
            this.handleTokenExpiring();
        }, timeBeforeExpiration);
    }
    
    // Xử lý khi token sắp hết hạn
    handleTokenExpiring() {
        // Thông báo cho người dùng
        const confirmRenew = confirm('Phiên đăng nhập của bạn sắp hết hạn. Bạn có muốn tiếp tục phiên làm việc không?');
        
        if (confirmRenew) {
            // Nếu đồng ý, thực hiện refresh token hoặc tự động đăng nhập lại
            // Ở đây bạn có thể thêm API để refresh token nếu cần
            // Tạm thời chỉ chuyển hướng về trang đăng nhập
            window.location.href = '/frontend/pages/login.php?expired=true';
        } else {
            // Nếu không đồng ý, đăng xuất
            this.clearToken();
        }
    }
    
    // Thực hiện API request với token
    async apiRequest(url, options = {}) {
        // Thêm token vào header nếu đã đăng nhập
        if (this.isLoggedIn()) {
            options.headers = options.headers || {};
            options.headers['Authorization'] = `Bearer ${this.getToken()}`;
            options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
        }
        
        // Thực hiện request
        try {
            const response = await fetch(url, options);
            
            // Kiểm tra nếu token hết hạn (401 Unauthorized)
            if (response.status === 401) {
                this.clearToken();
                return null;
            }
            
            // Trả về kết quả
            return response;
        } catch (error) {
            console.error('Lỗi khi gọi API:', error);
            throw error;
        }
    }
}

// Khởi tạo instance của AuthService
const authService = new AuthService();