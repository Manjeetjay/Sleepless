package com.devs.sleepless.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import com.devs.sleepless.model.Monitor;
import com.devs.sleepless.model.MonitorRequest;
import com.devs.sleepless.service.MonitorService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/monitors")
@RequiredArgsConstructor
public class MonitorController {

    private final MonitorService monitorService;

    @GetMapping
    public List<Monitor> getAllMonitors() {
        return monitorService.getAllMonitors();
    }

    @PostMapping
    public ResponseEntity<Monitor> createMonitor(@RequestBody MonitorRequest monitor) {
        return ResponseEntity.status(HttpStatus.CREATED).body(monitorService.createMonitor(monitor));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Monitor> getMonitorById(@PathVariable Long id) {
        return monitorService.getMonitorById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public Monitor updateMonitor(@PathVariable Long id, @RequestBody MonitorRequest monitor) {
        return monitorService.updateMonitor(id, monitor);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMonitor(@PathVariable Long id) {
        monitorService.deleteMonitor(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
    }
}
