<?php

class UserController {
    private $db;
    private $user;
    private $studentProfile;

    public function __construct($db) {
        $this->db = $db;
        $this->user = new User($db);
        $this->studentProfile = new StudentProfile($db);
    }

    // Lấy thông tin người dùng
    public function getUserInfo($user_id) {
        $this->user->user_id = $user_id;
        
        if($this->user->getUserById()) {
            $userInfo = [
                'user_id' => $this->user->user_id,
                'email' => $this->user->email,
                'display_name' => $this->user->display_name,
                'role' => $this->user->role,
                'created_at' => $this->user->created_at,
                'reset_token' => $this->user->reset_token,  // Thêm reset_token vào thông tin
                'reset_token_expiry' => $this->user->reset_token_expiry  // Thêm reset_token_expiry vào thông tin
            ];
            
            // Kiểm tra xem người dùng đã có profile chưa
            $this->studentProfile->user_id = $user_id;
            $profileExists = $this->studentProfile->getProfileByUserId();
            
            if($profileExists) {
                $userInfo['profile'] = [
                    'profile_id' => $this->studentProfile->profile_id,
                    'full_name' => $this->studentProfile->full_name,
                    'birth_date' => $this->studentProfile->birth_date,
                    'address' => $this->studentProfile->address,
                    'profile_picture' => $this->studentProfile->profile_picture,
                    'bio' => $this->studentProfile->bio
                ];
            } else {
                $userInfo['has_profile'] = false;
            }
            
            return [
                'status' => 200,
                'data' => $userInfo
            ];
        }
        
        return [
            'status' => 404,
            'message' => 'Không tìm thấy thông tin người dùng'
        ];
    }

    // Cập nhật tên hiển thị
    public function updateUserInfo($user_id, $data) {
        // Chỉ cập nhật display_name trong Users
        if(isset($data['display_name'])) {
            $this->user->user_id = $user_id;
            $this->user->display_name = $data['display_name'];
            $this->user->update();
        }
        
        return [
            'status' => 200,
            'message' => 'Cập nhật tên hiển thị thành công'
        ];
    }

    // Cập nhật hoặc tạo mới thông tin cá nhân
    public function updateProfile($user_id, $data) {
        $this->studentProfile->user_id = $user_id;
        $profileExists = $this->studentProfile->getProfileByUserId();
        
        // Nếu có data để cập nhật
        if(!empty($data)) {
            // Thiết lập dữ liệu
            if(isset($data['full_name'])) $this->studentProfile->full_name = $data['full_name'];
            if(isset($data['birth_date'])) $this->studentProfile->birth_date = $data['birth_date'];
            if(isset($data['address'])) $this->studentProfile->address = $data['address'];
            if(isset($data['profile_picture'])) $this->studentProfile->profile_picture = $data['profile_picture'];
            if(isset($data['bio'])) $this->studentProfile->bio = $data['bio'];
            
            // Cập nhật hoặc tạo mới profile
            if($profileExists) {
                // Cập nhật profile đã tồn tại
                if($this->studentProfile->update()) {
                    return [
                        'status' => 200,
                        'message' => 'Cập nhật thông tin cá nhân thành công'
                    ];
                }
            } else {
                // Tạo mới profile
                if($this->studentProfile->create()) {
                    return [
                        'status' => 201,
                        'message' => 'Tạo thông tin cá nhân thành công'
                    ];
                }
            }
            
            return [
                'status' => 500,
                'message' => 'Không thể cập nhật thông tin cá nhân'
            ];
        }
        
        return [
            'status' => 400,
            'message' => 'Không có dữ liệu để cập nhật'
        ];
    }
}
?>