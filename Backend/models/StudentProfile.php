<?php
// models/StudentProfile.php
// Model xử lý dữ liệu bảng StudentProfiles - Cải thiện

class StudentProfile {
    private $conn;
    private $table = 'StudentProfiles';

    // Các thuộc tính
    public $profile_id;
    public $user_id;
    public $full_name;
    public $birth_date;
    public $address;
    public $profile_picture;
    public $bio;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Tạo profile mới
    public function create() {
        $query = "INSERT INTO " . $this->table . " SET
                  user_id = :user_id,
                  full_name = :full_name,
                  birth_date = :birth_date,
                  address = :address,
                  profile_picture = :profile_picture,
                  bio = :bio,
                  created_at = NOW(),
                  updated_at = NOW()";

        $stmt = $this->conn->prepare($query);

        // Làm sạch dữ liệu - cải thiện xử lý null values
        $this->user_id = (int)$this->user_id;
        $this->full_name = htmlspecialchars(strip_tags($this->full_name ?? ''));
        $this->address = htmlspecialchars(strip_tags($this->address ?? ''));
        $this->profile_picture = htmlspecialchars(strip_tags($this->profile_picture ?? ''));
        $this->bio = htmlspecialchars(strip_tags($this->bio ?? ''));

        // Bind dữ liệu
        $stmt->bindParam(':user_id', $this->user_id, PDO::PARAM_INT);
        $stmt->bindParam(':full_name', $this->full_name);
        $stmt->bindParam(':birth_date', $this->birth_date);
        $stmt->bindParam(':address', $this->address);
        $stmt->bindParam(':profile_picture', $this->profile_picture);
        $stmt->bindParam(':bio', $this->bio);

        // Thực thi query
        if($stmt->execute()) {
            $this->profile_id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    // Lấy profile theo user_id
    public function getProfileByUserId() {
        $query = "SELECT * FROM " . $this->table . " WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':user_id', $this->user_id, PDO::PARAM_INT);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if($row) {
            $this->profile_id = $row['profile_id'];
            $this->user_id = $row['user_id'];
            $this->full_name = $row['full_name'];
            $this->birth_date = $row['birth_date'];
            $this->address = $row['address'];
            $this->profile_picture = $row['profile_picture'];
            $this->bio = $row['bio'];
            $this->created_at = $row['created_at'] ?? null;
            $this->updated_at = $row['updated_at'] ?? null;
            return true;
        }
        
        return false;
    }

    // Lấy profile theo profile_id
    public function getProfileById() {
        $query = "SELECT sp.*, u.email, u.display_name, u.role 
                  FROM " . $this->table . " sp
                  JOIN Users u ON sp.user_id = u.user_id 
                  WHERE sp.profile_id = :profile_id";
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':profile_id', $this->profile_id, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Cập nhật profile
    public function update() {
        $query = "UPDATE " . $this->table . " SET
                  full_name = :full_name,
                  birth_date = :birth_date,
                  address = :address,
                  profile_picture = :profile_picture,
                  bio = :bio,
                  updated_at = NOW()
                  WHERE user_id = :user_id";

        $stmt = $this->conn->prepare($query);

        // Làm sạch dữ liệu
        $this->full_name = htmlspecialchars(strip_tags($this->full_name ?? ''));
        $this->address = htmlspecialchars(strip_tags($this->address ?? ''));
        $this->profile_picture = htmlspecialchars(strip_tags($this->profile_picture ?? ''));
        $this->bio = htmlspecialchars(strip_tags($this->bio ?? ''));
        $this->user_id = (int)$this->user_id;

        // Bind dữ liệu
        $stmt->bindParam(':full_name', $this->full_name);
        $stmt->bindParam(':birth_date', $this->birth_date);
        $stmt->bindParam(':address', $this->address);
        $stmt->bindParam(':profile_picture', $this->profile_picture);
        $stmt->bindParam(':bio', $this->bio);
        $stmt->bindParam(':user_id', $this->user_id, PDO::PARAM_INT);

        // Thực thi query
        return $stmt->execute();
    }

    // Xóa profile
    public function delete() {
        $query = "DELETE FROM " . $this->table . " WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':user_id', $this->user_id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }

    // Kiểm tra profile có tồn tại không
    public function exists() {
        $query = "SELECT COUNT(*) FROM " . $this->table . " WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':user_id', $this->user_id, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchColumn() > 0;
    }

    // Lấy tất cả profiles (cho admin)
    public function getAllProfiles($limit = 50, $offset = 0) {
        $query = "SELECT sp.*, u.email, u.display_name, u.role, u.created_at as user_created_at
                  FROM " . $this->table . " sp
                  JOIN Users u ON sp.user_id = u.user_id 
                  ORDER BY sp.updated_at DESC
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Đếm tổng số profiles
    public function countProfiles() {
        $query = "SELECT COUNT(*) FROM " . $this->table;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt->fetchColumn();
    }

    // Tìm kiếm profiles theo tên
    public function searchByName($searchTerm, $limit = 20) {
        $query = "SELECT sp.*, u.email, u.display_name 
                  FROM " . $this->table . " sp
                  JOIN Users u ON sp.user_id = u.user_id 
                  WHERE sp.full_name LIKE :search_term
                  ORDER BY sp.full_name ASC
                  LIMIT :limit";
        
        $stmt = $this->conn->prepare($query);
        $searchTerm = '%' . $searchTerm . '%';
        $stmt->bindParam(':search_term', $searchTerm);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Tính tuổi từ birth_date
    public function calculateAge() {
        if (empty($this->birth_date)) {
            return null;
        }
        
        $birthDate = new DateTime($this->birth_date);
        $today = new DateTime();
        $age = $today->diff($birthDate)->y;
        
        return $age;
    }

    // Kiểm tra và tạo bảng nếu chưa có
    public function createTableIfNotExists() {
        $query = "CREATE TABLE IF NOT EXISTS " . $this->table . " (
            profile_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL UNIQUE,
            full_name VARCHAR(100) NOT NULL,
            birth_date DATE NULL,
            address TEXT NULL,
            profile_picture VARCHAR(500) NULL,
            bio TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
            INDEX idx_user_id (user_id),
            INDEX idx_full_name (full_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

        try {
            $this->conn->exec($query);
            return true;
        } catch (Exception $e) {
            error_log("Error creating StudentProfiles table: " . $e->getMessage());
            return false;
        }
    }
}
?>