<?php
// controllers/PasswordResetController.php

// Include PHPMailer thủ công (thay vì autoload)
require_once 'vendor/phpmailer/PHPMailer-6.8.1/src/Exception.php';
require_once 'vendor/phpmailer/PHPMailer-6.8.1/src/PHPMailer.php';
require_once 'vendor/phpmailer/PHPMailer-6.8.1/src/SMTP.php';
require_once 'config/EmailConfig.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class PasswordResetController {
    private $db;
    private $user;

    public function __construct($db) {
        $this->db = $db;
        $this->user = new User($db);
    }

    public function forgotPassword($data) {
        if(empty($data['email'])) {
            return [
                'status' => 400,
                'message' => 'Email là bắt buộc'
            ];
        }

        $this->user->email = $data['email'];
        
        if(!$this->user->findByEmail()) {
            return [
                'status' => 404,
                'message' => 'Email không tồn tại trong hệ thống'
            ];
        }

        $otp = $this->user->generateResetOTP();
        
        if($otp) {
            if($this->sendOTPEmail($data['email'], $otp)) {
                return [
                    'status' => 200,
                    'message' => 'Mã OTP đã được gửi đến email của bạn',
                    'email' => $data['email']
                ];
            } else {
                return [
                    'status' => 500,
                    'message' => 'Không thể gửi email. Vui lòng thử lại sau.'
                ];
            }
        }
        
        return [
            'status' => 500,
            'message' => 'Không thể tạo OTP'
        ];
    }

    public function verifyOTP($data) {
        if(empty($data['otp'])) {
            return [
                'status' => 400,
                'message' => 'Mã OTP là bắt buộc'
            ];
        }

        if($this->user->verifyResetOTP($data['otp'])) {
            return [
                'status' => 200,
                'message' => 'OTP hợp lệ',
                'email' => $this->user->email
            ];
        }

        return [
            'status' => 400,
            'message' => 'OTP không hợp lệ hoặc đã hết hạn'
        ];
    }

    public function resetPassword($data) {
        if(empty($data['otp']) || empty($data['new_password'])) {
            return [
                'status' => 400,
                'message' => 'OTP và mật khẩu mới là bắt buộc'
            ];
        }

        if(!$this->user->verifyResetOTP($data['otp'])) {
            return [
                'status' => 400,
                'message' => 'OTP không hợp lệ hoặc đã hết hạn'
            ];
        }

        if($this->user->checkCurrentPassword($data['new_password'])) {
            return [
                'status' => 400,
                'message' => 'Mật khẩu mới không được trùng với mật khẩu cũ',
                'same_password' => true
            ];
        }

        if($this->user->resetPasswordWithOTP($data['new_password'])) {
            return [
                'status' => 200,
                'message' => 'Đặt lại mật khẩu thành công'
            ];
        }

        return [
            'status' => 500,
            'message' => 'Không thể đặt lại mật khẩu'
        ];
    }

    private function sendOTPEmail($email, $otp) {
        $mail = new PHPMailer(true);
        
        try {
            $mail->isSMTP();
            $mail->Host       = SMTP_HOST;
            $mail->SMTPAuth   = true;
            $mail->Username   = SMTP_USERNAME;
            $mail->Password   = SMTP_PASSWORD;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = SMTP_PORT;
            $mail->CharSet    = 'UTF-8';
            
            $mail->setFrom(FROM_EMAIL, FROM_NAME);
            $mail->addAddress($email);
            
            $mail->isHTML(true);
            $mail->Subject = 'Mã xác thực đặt lại mật khẩu - Flameo English';
            $mail->Body    = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <div style='text-align: center; margin-bottom: 30px;'>
                        <h2 style='color: #4A90E2; margin: 0;'>🔥 Flameo English</h2>
                    </div>
                    
                    <div style='background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid #4A90E2;'>
                        <h3 style='color: #333; margin-top: 0;'>Đặt lại mật khẩu</h3>
                        <p style='color: #666; font-size: 16px; line-height: 1.5;'>
                            Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Flameo English.
                        </p>
                        
                        <p style='color: #333; font-size: 16px; margin: 20px 0 10px 0;'>
                            <strong>Mã OTP của bạn là:</strong>
                        </p>
                        
                        <div style='background: white; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #4A90E2; border: 3px dashed #4A90E2; margin: 20px 0; border-radius: 8px; letter-spacing: 8px;'>
                            $otp
                        </div>
                        
                        <div style='background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;'>
                            <p style='color: #856404; margin: 0; font-weight: bold;'>
                                ⚠️ Mã này sẽ hết hạn sau 15 phút
                            </p>
                        </div>
                        
                        <p style='color: #666; font-size: 14px; margin-top: 20px;'>
                            Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
                        </p>
                    </div>
                    
                    <div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;'>
                        <p style='color: #999; font-size: 12px; margin: 0;'>
                            Email tự động từ Flameo English - Không reply
                        </p>
                    </div>
                </div>
            ";
            
            $mail->send();
            error_log("OTP sent successfully to $email: $otp");
            return true;
            
        } catch (Exception $e) {
            error_log("Email sending failed to $email: {$mail->ErrorInfo}");
            return false;
        }
    }
}
?>