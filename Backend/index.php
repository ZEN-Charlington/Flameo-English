<?php
    require_once './config/database.php';
    $database = new Database();
    $conn = $database->getConnection();

    // Kiểm tra kết nối
    if ($conn) {
        echo "Kết nối thành công!";
    } else {
        echo "Kết nối thất bại.";
    }
?>