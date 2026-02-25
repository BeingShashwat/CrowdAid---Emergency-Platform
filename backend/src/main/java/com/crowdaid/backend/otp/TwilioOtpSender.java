package com.crowdaid.backend.otp;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class TwilioOtpSender implements OtpSender {

    private final boolean enabled;
    private final String accountSid;
    private final String authToken;
    private final String fromNumber;
    private final String otpTemplate;
    private final RestClient restClient;

    public TwilioOtpSender(
        @Value("${app.twilio.enabled:false}") boolean enabled,
        @Value("${app.twilio.account-sid:}") String accountSid,
        @Value("${app.twilio.auth-token:}") String authToken,
        @Value("${app.twilio.from-number:}") String fromNumber,
        @Value("${app.twilio.otp-template:Your CrowdAid OTP is %s. It expires in 10 minutes.}") String otpTemplate
    ) {
        this.enabled = enabled;
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.fromNumber = fromNumber;
        this.otpTemplate = otpTemplate;
        this.restClient = RestClient.builder()
            .baseUrl("https://api.twilio.com/2010-04-01")
            .build();
    }

    @Override
    public void sendOtp(String phone, String otpCode) {
        if (!enabled || accountSid.isBlank() || authToken.isBlank() || fromNumber.isBlank()) {
            log.info("OTP for {} is {}", phone, otpCode);
            return;
        }

        String basicAuthRaw = accountSid + ":" + authToken;
        String basicAuth = Base64.getEncoder().encodeToString(basicAuthRaw.getBytes(StandardCharsets.UTF_8));
        String body = "To=" + urlEncode(phone)
            + "&From=" + urlEncode(fromNumber)
            + "&Body=" + urlEncode(String.format(otpTemplate, otpCode));

        restClient.post()
            .uri("/Accounts/{accountSid}/Messages.json", accountSid)
            .header(HttpHeaders.AUTHORIZATION, "Basic " + basicAuth)
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(body)
            .retrieve()
            .toBodilessEntity();
    }

    private String urlEncode(String input) {
        return java.net.URLEncoder.encode(input, StandardCharsets.UTF_8);
    }
}
