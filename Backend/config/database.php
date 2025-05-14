<?php
// config/database.php
// Kết nối database

class Database {
    private $host = "localhost";
    private $db_name = "flameo_english";
    private $username = "root";
    private $password = "conchiu123";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception) {
            echo "Lỗi kết nối: " . $exception->getMessage();
        }
        return $this->conn;
    }
}

?>