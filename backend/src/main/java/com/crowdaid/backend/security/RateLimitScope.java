package com.crowdaid.backend.security;

public enum RateLimitScope {
    OTP_REQUEST_PHONE,
    OTP_REQUEST_IP,
    OTP_VERIFY_PHONE,
    OTP_VERIFY_IP,
    SOS_USER,
    SOS_IP
}
