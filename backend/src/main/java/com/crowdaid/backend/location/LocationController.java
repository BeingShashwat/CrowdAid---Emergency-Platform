package com.crowdaid.backend.location;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.crowdaid.backend.common.ApiResponse;

@RestController
@RequestMapping("/api/location")
public class LocationController {

    @GetMapping("/reverse-geocode")
    public ApiResponse<Map<String, String>> reverseGeocode(
        @RequestParam double lat,
        @RequestParam double lng
    ) {
        String address = String.format("Lat %.6f, Lng %.6f", lat, lng);
        return ApiResponse.ok(Map.of("address", address));
    }
}
