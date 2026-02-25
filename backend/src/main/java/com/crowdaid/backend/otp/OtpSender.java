package com.crowdaid.backend.otp;

public interface OtpSender {
    void sendOtp(String phone, String otpCode);
}
