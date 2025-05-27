<?php
// controllers/StudentProfileController.php

require_once __DIR__ . '/../models/StudentProfile.php';
require_once __DIR__ . '/../models/User.php';

class StudentProfileController {
    private $db;
    private $studentProfile;
    private $user;

    public function __construct($db) {
        $this->db = $db;
        $this->studentProfile = new StudentProfile($db);
        $this->user = new User($db);
    }

    public function getProfile($user_id) {
        try {
            $this->studentProfile->user_id = $user_id;
            
            if ($this->studentProfile->getProfileByUserId()) {
                return [
                    'status' => 200,
                    'data' => [
                        'profile_id' => $this->studentProfile->profile_id,
                        'user_id' => $this->studentProfile->user_id,
                        'full_name' => $this->studentProfile->full_name,
                        'birth_date' => $this->studentProfile->birth_date,
                        'address' => $this->studentProfile->address,
                        'profile_picture' => $this->studentProfile->profile_picture,
                        'bio' => $this->studentProfile->bio
                    ],
                    'message' => 'Lấy thông tin profile thành công'
                ];
            } else {
                return [
                    'status' => 404,
                    'message' => 'Chưa có thông tin profile',
                    'data' => null
                ];
            }
        } catch (Exception $e) {
            return [
                'status' => 500,
                'message' => 'Lỗi khi lấy thông tin profile: ' . $e->getMessage()
            ];
        }
    }

    public function createOrUpdateProfile($user_id, $data) {
        try {
            // Kiểm tra user có tồn tại không
            $this->user->user_id = $user_id;
            if (!$this->user->getUserById()) {
                return [
                    'status' => 404,
                    'message' => 'Không tìm thấy user'
                ];
            }

            // Kiểm tra profile đã tồn tại chưa
            $this->studentProfile->user_id = $user_id;
            $profileExists = $this->studentProfile->getProfileByUserId();

            // Validate dữ liệu với context tương ứng
            $validation = $this->validateProfileData($data, $profileExists);
            if (!$validation['valid']) {
                return [
                    'status' => 400,
                    'message' => 'Dữ liệu không hợp lệ',
                    'errors' => $validation['errors']
                ];
            }

            // Gán dữ liệu đã validate
            $this->studentProfile->user_id = $user_id;
            $this->studentProfile->full_name = $validation['data']['full_name'];
            $this->studentProfile->birth_date = $validation['data']['birth_date'];
            $this->studentProfile->address = $validation['data']['address'];
            $this->studentProfile->profile_picture = $validation['data']['profile_picture'];
            $this->studentProfile->bio = $validation['data']['bio'];

            if ($profileExists) {
                // Cập nhật profile
                if ($this->studentProfile->update()) {
                    return [
                        'status' => 200,
                        'message' => 'Cập nhật profile thành công',
                        'data' => [
                            'profile_id' => $this->studentProfile->profile_id,
                            'user_id' => $user_id,
                            'full_name' => $this->studentProfile->full_name,
                            'birth_date' => $this->studentProfile->birth_date,
                            'address' => $this->studentProfile->address,
                            'profile_picture' => $this->studentProfile->profile_picture,
                            'bio' => $this->studentProfile->bio
                        ]
                    ];
                } else {
                    return [
                        'status' => 500,
                        'message' => 'Không thể cập nhật profile'
                    ];
                }
            } else {
                // Tạo profile mới
                if ($this->studentProfile->create()) {
                    return [
                        'status' => 201,
                        'message' => 'Tạo profile thành công',
                        'data' => [
                            'profile_id' => $this->studentProfile->profile_id,
                            'user_id' => $user_id,
                            'full_name' => $this->studentProfile->full_name,
                            'birth_date' => $this->studentProfile->birth_date,
                            'address' => $this->studentProfile->address,
                            'profile_picture' => $this->studentProfile->profile_picture,
                            'bio' => $this->studentProfile->bio
                        ]
                    ];
                } else {
                    return [
                        'status' => 500,
                        'message' => 'Không thể tạo profile'
                    ];
                }
            }
        } catch (Exception $e) {
            return [
                'status' => 500,
                'message' => 'Lỗi khi xử lý profile: ' . $e->getMessage()
            ];
        }
    }

    // Validate dữ liệu profile với context khác nhau
    private function validateProfileData($data, $isUpdate = false) {
        $errors = [];
        $validatedData = [];

        // Validate full_name - Logic khác nhau cho create vs update
        if ($isUpdate) {
            // Khi update: bắt buộc phải có full_name
            if (empty($data['full_name'])) {
                $errors['full_name'] = 'Khi cập nhật, họ và tên không được để trống';
            } elseif (strlen($data['full_name']) < 2) {
                $errors['full_name'] = 'Họ và tên phải có ít nhất 2 ký tự';
            } elseif (strlen($data['full_name']) > 100) {
                $errors['full_name'] = 'Họ và tên không được quá 100 ký tự';
            } elseif (!preg_match('/^[a-zA-ZÀ-ỹ\s]+$/u', $data['full_name'])) {
                $errors['full_name'] = 'Họ và tên chỉ được chứa chữ cái và khoảng trắng';
            } else {
                $validatedData['full_name'] = trim($data['full_name']);
            }
        } else {
            // Khi create: cho phép null hoặc empty để tạo skeleton profile
            if (empty($data['full_name'])) {
                $validatedData['full_name'] = null;
            } elseif (strlen($data['full_name']) < 2) {
                $errors['full_name'] = 'Họ và tên phải có ít nhất 2 ký tự';
            } elseif (strlen($data['full_name']) > 100) {
                $errors['full_name'] = 'Họ và tên không được quá 100 ký tự';
            } elseif (!preg_match('/^[a-zA-ZÀ-ỹ\s]+$/u', $data['full_name'])) {
                $errors['full_name'] = 'Họ và tên chỉ được chứa chữ cái và khoảng trắng';
            } else {
                $validatedData['full_name'] = trim($data['full_name']);
            }
        }

        // Validate birth_date (giống như cũ)
        if (!empty($data['birth_date'])) {
            $birthDate = DateTime::createFromFormat('Y-m-d', $data['birth_date']);
            if (!$birthDate) {
                $errors['birth_date'] = 'Định dạng ngày sinh không hợp lệ (YYYY-MM-DD)';
            } else {
                $today = new DateTime();
                $age = $today->diff($birthDate)->y;
                
                if ($birthDate > $today) {
                    $errors['birth_date'] = 'Ngày sinh không thể là tương lai';
                } elseif ($age < 5) {
                    $errors['birth_date'] = 'Tuổi phải từ 5 tuổi trở lên';
                } elseif ($age > 120) {
                    $errors['birth_date'] = 'Tuổi không được quá 120 tuổi';
                } else {
                    $validatedData['birth_date'] = $data['birth_date'];
                }
            }
        } else {
            $validatedData['birth_date'] = null;
        }

        // Validate address (giống như cũ)
        if (!empty($data['address'])) {
            if (strlen($data['address']) > 255) {
                $errors['address'] = 'Địa chỉ không được quá 255 ký tự';
            } else {
                $validatedData['address'] = trim($data['address']);
            }
        } else {
            $validatedData['address'] = '';
        }

        // Validate profile_picture URL (giống như cũ)
        if (!empty($data['profile_picture'])) {
            if (!$this->isValidImageUrl($data['profile_picture'])) {
                $errors['profile_picture'] = 'URL ảnh không hợp lệ';
            } else {
                $validatedData['profile_picture'] = $data['profile_picture'];
            }
        } else {
            $validatedData['profile_picture'] = '';
        }

        // Validate bio (giống như cũ)
        if (!empty($data['bio'])) {
            if (strlen($data['bio']) > 500) {
                $errors['bio'] = 'Giới thiệu bản thân không được quá 500 ký tự';
            } else {
                $validatedData['bio'] = trim($data['bio']);
            }
        } else {
            $validatedData['bio'] = '';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'data' => $validatedData
        ];
    }

    private function isValidImageUrl($url) {
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }

        if (strlen($url) > 1000) {
            return false;
        }

        if (!preg_match('/^https:\/\//', $url)) {
            return false;
        }

        $allowedDomains = [
            'imgur.com', 'i.imgur.com',
            'images.unsplash.com', 'unsplash.com',
            'cdn.pixabay.com', 'pixabay.com', 
            'images.pexels.com', 'pexels.com',
            'drive.google.com',
            'dropbox.com',
            'postimg.cc', 'i.postimg.cc',
            'ibb.co', 'i.ibb.co',
            'imagehost.io',
            'cdn.discordapp.com',
            'pinterest.com', 'i.pinimg.com', 'pinimg.com',
            'instagram.com', 'cdninstagram.com',
            'flickr.com', 'staticflickr.com',
            'reddit.com', 'i.redd.it',
            'tumblr.com', 'media.tumblr.com'
        ];

        $domain = parse_url($url, PHP_URL_HOST);
        $isAllowedDomain = false;
        
        foreach ($allowedDomains as $allowedDomain) {
            if (strpos($domain, $allowedDomain) !== false) {
                $isAllowedDomain = true;
                break;
            }
        }
        
        return $isAllowedDomain;
    }

    public function deleteProfile($user_id) {
        try {
            $this->studentProfile->user_id = $user_id;
            
            if ($this->studentProfile->getProfileByUserId()) {
                if ($this->studentProfile->delete()) {
                    return [
                        'status' => 200,
                        'message' => 'Xóa toàn bộ thông tin cá nhân thành công'
                    ];
                } else {
                    return [
                        'status' => 500,
                        'message' => 'Không thể xóa thông tin cá nhân'
                    ];
                }
            } else {
                return [
                    'status' => 404,
                    'message' => 'Không tìm thấy thông tin cá nhân để xóa'
                ];
            }
        } catch (Exception $e) {
            return [
                'status' => 500,
                'message' => 'Lỗi khi xóa thông tin cá nhân: ' . $e->getMessage()
            ];
        }
    }
}
?>