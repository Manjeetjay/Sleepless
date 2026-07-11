package com.devs.sleepless.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.devs.sleepless.dto.HealthDto;

@RestController
public class HealthController {

    @GetMapping("/api/health")
    public ResponseEntity<HealthDto> health() {
        return ResponseEntity.ok(HealthDto.builder()
                .status("200")
                .message("Good Health")
                .build());
    }
}
