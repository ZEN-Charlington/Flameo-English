// frontend/js/common.js

document.addEventListener('DOMContentLoaded', function() {
    // Thêm class vào html khi trang đang tải
    document.documentElement.classList.add('loading');
    
    // Khi trang đã tải xong
    window.addEventListener('load', function() {
        // Xóa class loading
        document.documentElement.classList.remove('loading');
    });
    
    // Xử lý chuyển trang
    document.addEventListener('click', function(e) {
        // Tìm thẻ a gần nhất (nếu click vào con của thẻ a)
        let target = e.target;
        while (target && target.tagName !== 'A') {
            target = target.parentNode;
            if (!target || target === document.body) break;
        }
        
        // Nếu là thẻ a và không mở tab mới
        if (target && target.tagName === 'A' && !target.getAttribute('target')) {
            // Kiểm tra xem có phải link nội bộ không
            const href = target.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('#')) {
                e.preventDefault();
                
                // Tạo hiệu ứng chuyển trang
                const transition = document.createElement('div');
                transition.className = 'page-transition';
                document.body.appendChild(transition);
                
                // Chuyển trang sau hiệu ứng
                setTimeout(function() {
                    window.location.href = href;
                }, 300);
            }
        }
    });
    
    // Xử lý chuyển trang khi submit form
    document.querySelectorAll('form').forEach(form => {
        // Bỏ qua form có data-no-transition
        if (form.getAttribute('data-no-transition') === 'true') return;
        
        form.addEventListener('submit', function(e) {
            // Ngăn submit mặc định
            e.preventDefault();
            
            // Tạo hiệu ứng chuyển trang
            const transition = document.createElement('div');
            transition.className = 'page-transition';
            document.body.appendChild(transition);
            
            // Submit form sau hiệu ứng
            setTimeout(() => {
                this.submit();
            }, 300);
        });
    });
});