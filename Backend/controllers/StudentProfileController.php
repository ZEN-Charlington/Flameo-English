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
            // Validate user_id
            if (!is_numeric($user_id) || $user_id <= 0) {
                return [
                    'status' => 400,
                    'message' => 'ID người dùng không hợp lệ'
                ];
            }

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
            // Validate user_id
            if (!is_numeric($user_id) || $user_id <= 0) {
                return [
                    'status' => 400,
                    'message' => 'ID người dùng không hợp lệ'
                ];
            }

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
                            'bio' => $this->studentProfile->bio,
                            'is_complete' => $validation['is_complete']
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
                            'bio' => $this->studentProfile->bio,
                            'is_complete' => $validation['is_complete']
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

    // Validate dữ liệu profile với logic nghiệp vụ chính xác
    private function validateProfileData($data, $isUpdate = false) {
        $errors = [];
        $validatedData = [];

        // === VALIDATE FULL_NAME ===
        if ($isUpdate) {
            // Khi update: Kiểm tra xem user có gửi full_name không
            if (isset($data['full_name'])) {
                // Nếu có gửi full_name thì phải hợp lệ
                if (empty($data['full_name']) || trim($data['full_name']) === '') {
                    $errors['full_name'] = 'Họ và tên không được để trống';
                } elseif (strlen(trim($data['full_name'])) < 2) {
                    $errors['full_name'] = 'Họ và tên phải có ít nhất 2 ký tự';
                } elseif (strlen($data['full_name']) > 100) {
                    $errors['full_name'] = 'Họ và tên không được quá 100 ký tự';
                } elseif (!preg_match('/^[a-zA-ZÀ-ỹ\s]+$/u', trim($data['full_name']))) {
                    $errors['full_name'] = 'Họ và tên chỉ được chứa chữ cái và khoảng trắng';
                } else {
                    $validatedData['full_name'] = trim($data['full_name']);
                }
            } else {
                // Nếu không gửi full_name, giữ nguyên giá trị cũ
                $validatedData['full_name'] = $this->studentProfile->full_name;
            }
        } else {
            // Khi create: cho phép null để tạo skeleton profile
            if (empty($data['full_name'])) {
                $validatedData['full_name'] = null;
            } elseif (strlen(trim($data['full_name'])) < 2) {
                $errors['full_name'] = 'Họ và tên phải có ít nhất 2 ký tự';
            } elseif (strlen($data['full_name']) > 100) {
                $errors['full_name'] = 'Họ và tên không được quá 100 ký tự';
            } elseif (!preg_match('/^[a-zA-ZÀ-ỹ\s]+$/u', trim($data['full_name']))) {
                $errors['full_name'] = 'Họ và tên chỉ được chứa chữ cái và khoảng trắng';
            } else {
                $validatedData['full_name'] = trim($data['full_name']);
            }
        }

        // === VALIDATE BIRTH_DATE ===
        if ($isUpdate) {
            // Khi update: Kiểm tra xem user có gửi birth_date không
            if (isset($data['birth_date'])) {
                // Nếu có gửi birth_date thì phải hợp lệ
                if (empty($data['birth_date']) || trim($data['birth_date']) === '') {
                    $errors['birth_date'] = 'Ngày sinh không được để trống';
                } else {
                    $birthDate = DateTime::createFromFormat('Y-m-d', $data['birth_date']);
                    if (!$birthDate || $birthDate->format('Y-m-d') !== $data['birth_date']) {
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
                }
            } else {
                // Nếu không gửi birth_date, giữ nguyên giá trị cũ
                $validatedData['birth_date'] = $this->studentProfile->birth_date;
            }
        } else {
            // Khi create: cho phép null
            if (!empty($data['birth_date'])) {
                $birthDate = DateTime::createFromFormat('Y-m-d', $data['birth_date']);
                if (!$birthDate || $birthDate->format('Y-m-d') !== $data['birth_date']) {
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
        }

        // === VALIDATE ADDRESS ===
        if ($isUpdate) {
            // Khi update: Kiểm tra xem user có gửi address không
            if (isset($data['address'])) {
                // Nếu có gửi address thì phải hợp lệ
                if (empty($data['address']) || trim($data['address']) === '') {
                    $errors['address'] = 'Địa chỉ không được để trống';
                } elseif (strlen($data['address']) > 255) {
                    $errors['address'] = 'Địa chỉ không được quá 255 ký tự';
                } else {
                    $validatedData['address'] = trim($data['address']);
                }
            } else {
                // Nếu không gửi address, giữ nguyên giá trị cũ
                $validatedData['address'] = $this->studentProfile->address;
            }
        } else {
            // Khi create: cho phép empty
            if (!empty($data['address'])) {
                if (strlen($data['address']) > 255) {
                    $errors['address'] = 'Địa chỉ không được quá 255 ký tự';
                } else {
                    $validatedData['address'] = trim($data['address']);
                }
            } else {
                $validatedData['address'] = '';
            }
        }

        // === VALIDATE PROFILE_PICTURE (OPTIONAL) ===
        if (isset($data['profile_picture'])) {
            if (!empty($data['profile_picture'])) {
                if (!$this->isValidImageUrl($data['profile_picture'])) {
                    $errors['profile_picture'] = 'URL ảnh không hợp lệ';
                } else {
                    $validatedData['profile_picture'] = $data['profile_picture'];
                }
            } else {
                // Cho phép để trống
                $validatedData['profile_picture'] = '';
            }
        } else {
            // Nếu không gửi profile_picture, giữ nguyên giá trị cũ (khi update)
            if ($isUpdate) {
                $validatedData['profile_picture'] = $this->studentProfile->profile_picture;
            } else {
                $validatedData['profile_picture'] = '';
            }
        }

        // === VALIDATE BIO (OPTIONAL) ===
        if (isset($data['bio'])) {
            if (!empty($data['bio'])) {
                if (strlen($data['bio']) > 500) {
                    $errors['bio'] = 'Giới thiệu bản thân không được quá 500 ký tự';
                } else {
                    $validatedData['bio'] = trim($data['bio']);
                }
            } else {
                // Cho phép để trống
                $validatedData['bio'] = '';
            }
        } else {
            // Nếu không gửi bio, giữ nguyên giá trị cũ (khi update)
            if ($isUpdate) {
                $validatedData['bio'] = $this->studentProfile->bio;
            } else {
                $validatedData['bio'] = '';
            }
        }

        // === KIỂM TRA TÍNH HOÀN THIỆN CỦA PROFILE SAU KHI MERGE ===
        if ($isUpdate) {
            // Lấy giá trị cuối cùng sau khi merge với dữ liệu cũ
            $finalFullName = $validatedData['full_name'];
            $finalBirthDate = $validatedData['birth_date'];
            $finalAddress = $validatedData['address'];
            
            // Kiểm tra các trường bắt buộc sau khi update
            if (empty($finalFullName) || trim($finalFullName) === '') {
                $errors['profile_completeness'] = 'Profile chưa hoàn thiện: thiếu họ và tên';
            }
            
            if (empty($finalBirthDate) || trim($finalBirthDate) === '') {
                $errors['profile_completeness'] = 'Profile chưa hoàn thiện: thiếu ngày sinh';
            }
            
            if (empty($finalAddress) || trim($finalAddress) === '') {
                $errors['profile_completeness'] = 'Profile chưa hoàn thiện: thiếu địa chỉ';
            }
        }

        // Tính toán is_complete dựa trên dữ liệu cuối cùng
        $isComplete = false;
        if ($isUpdate) {
            $isComplete = !empty($validatedData['full_name']) && 
                         !empty($validatedData['birth_date']) && 
                         !empty($validatedData['address']) &&
                         empty($errors);
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'data' => $validatedData,
            'is_complete' => $isComplete
        ];
    }

    private function isValidImageUrl($url) {
        // Basic URL validation
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return false;
        }

        // Check URL length
        if (strlen($url) > 1000) {
            return false;
        }

        // Only allow HTTPS
        if (!preg_match('/^https:\/\//', $url)) {
            return false;
        }
         $headers = @get_headers($url, 1);
        if ($headers && isset($headers['Content-Length'])) {
            $fileSize = is_array($headers['Content-Length']) 
                ? end($headers['Content-Length']) 
                : $headers['Content-Length'];
            
            if ($fileSize > 8 * 1024 * 1024) {
                return false;
            }
        }

        // Whitelist allowed domains
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
            // Validate user_id
            if (!is_numeric($user_id) || $user_id <= 0) {
                return [
                    'status' => 400,
                    'message' => 'ID người dùng không hợp lệ'
                ];
            }

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

    // Method helper để kiểm tra profile có hoàn thiện không
    public function isProfileComplete($user_id) {
        try {
            // Validate user_id
            if (!is_numeric($user_id) || $user_id <= 0) {
                return [
                    'status' => 400,
                    'message' => 'ID người dùng không hợp lệ'
                ];
            }

            $this->studentProfile->user_id = $user_id;
            
            if ($this->studentProfile->getProfileByUserId()) {
                $isComplete = !empty($this->studentProfile->full_name) && 
                            !empty($this->studentProfile->birth_date) && 
                            !empty($this->studentProfile->address);
                
                return [
                    'status' => 200,
                    'is_complete' => $isComplete,
                    'missing_fields' => $this->getMissingRequiredFields()
                ];
            } else {
                return [
                    'status' => 404,
                    'is_complete' => false,
                    'message' => 'Profile không tồn tại'
                ];
            }
        } catch (Exception $e) {
            return [
                'status' => 500,
                'message' => 'Lỗi khi kiểm tra profile: ' . $e->getMessage()
            ];
        }
    }

    // Method helper để lấy danh sách các trường bắt buộc còn thiếu
    private function getMissingRequiredFields() {
        $missing = [];
        
        if (empty($this->studentProfile->full_name)) {
            $missing[] = 'full_name';
        }
        
        if (empty($this->studentProfile->birth_date)) {
            $missing[] = 'birth_date';
        }
        
        if (empty($this->studentProfile->address)) {
            $missing[] = 'address';
        }
        
        return $missing;
    }
}
?>