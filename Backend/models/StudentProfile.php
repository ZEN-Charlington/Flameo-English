<?php
// models/StudentProfile.php
// Model xử lý dữ liệu bảng StudentProfiles

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
                  bio = :bio";

        $stmt = $this->conn->prepare($query);

        // Làm sạch dữ liệu
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));
        $this->full_name = htmlspecialchars(strip_tags($this->full_name ?? ''));
        $this->address = htmlspecialchars(strip_tags($this->address ?? ''));
        $this->profile_picture = htmlspecialchars(strip_tags($this->profile_picture ?? ''));
        $this->bio = htmlspecialchars(strip_tags($this->bio ?? ''));

        // Bind dữ liệu
        $stmt->bindParam(':user_id', $this->user_id);
        $stmt->bindParam(':full_name', $this->full_name);
        $stmt->bindParam(':birth_date', $this->birth_date);
        $stmt->bindParam(':address', $this->address);
        $stmt->bindParam(':profile_picture', $this->profile_picture);
        $stmt->bindParam(':bio', $this->bio);

        // Thực thi query
        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    // Lấy profile theo user_id
    public function getProfileByUserId() {
        $query = "SELECT * FROM " . $this->table . " WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(':user_id', $this->user_id);
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
            return true;
        }
        
        return false;
    }

    // Cập nhật profile
    public function update() {
        $query = "UPDATE " . $this->table . " SET
                  full_name = :full_name,
                  birth_date = :birth_date,
                  address = :address,
                  profile_picture = :profile_picture,
                  bio = :bio
                  WHERE user_id = :user_id";

        $stmt = $this->conn->prepare($query);

        // Làm sạch dữ liệu
        $this->full_name = htmlspecialchars(strip_tags($this->full_name ?? ''));
        $this->address = htmlspecialchars(strip_tags($this->address ?? ''));
        $this->profile_picture = htmlspecialchars(strip_tags($this->profile_picture ?? ''));
        $this->bio = htmlspecialchars(strip_tags($this->bio ?? ''));
        $this->user_id = htmlspecialchars(strip_tags($this->user_id));

        // Bind dữ liệu
        $stmt->bindParam(':full_name', $this->full_name);
        $stmt->bindParam(':birth_date', $this->birth_date);
        $stmt->bindParam(':address', $this->address);
        $stmt->bindParam(':profile_picture', $this->profile_picture);
        $stmt->bindParam(':bio', $this->bio);
        $stmt->bindParam(':user_id', $this->user_id);

        // Thực thi query
        if($stmt->execute()) {
            return true;
        }

        return false;
    }
}
?>