<?php
// frontend/Components/checkAuth.php
// Kiểm tra đăng nhập cho các trang yêu cầu xác thực

// Sử dụng JavaScript để kiểm tra token JWT
echo '<script>
// Kiểm tra đăng nhập
(function() {
    if (!localStorage.getItem("token")) {
        window.location.href = "/frontend/pages/login.php";
    } else {
        // Xác thực token
        fetch("/backend/api.php/verify-token", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        })
        .then(response => response.json())
        .then(data => {
            if (!data.valid) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/frontend/pages/login.php?session_expired=true";
            }
        })
        .catch(error => {
            console.error("Lỗi khi xác thực token:", error);
            // Vẫn giữ token trong trường hợp lỗi mạng tạm thời
        });
    }
})();
</script>';
?>