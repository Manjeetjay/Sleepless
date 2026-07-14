package com.devs.sleepless.service;

import java.util.List;
import java.util.Optional;

import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Service;

import com.devs.sleepless.dto.MonitorRequest;
import com.devs.sleepless.dto.UpdateMonitor;
import com.devs.sleepless.model.Monitor;
import com.devs.sleepless.repository.MonitorRepository;

import lombok.RequiredArgsConstructor;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
public class MonitorService {

    private final MonitorRepository monitorRepository;
    private final MonitorScheduler monitorScheduler;
    private final CounterCacheService counterCache;
    private final ObjectMapper objectMapper;

    public List<Monitor> getAllMonitors() {
        List<Monitor> monitors = monitorRepository.findAll();
        for (Monitor monitor : monitors) {
            monitorScheduler.schedule(monitor);
            overlayDeltas(monitor);
        }
        return monitors;
    }

    public Optional<Monitor> getMonitorById(Long id) {
        return monitorRepository.findById(id)
                .map(monitor -> {
                    overlayDeltas(monitor);
                    return monitor;
                });
    }

    public Monitor createMonitor(MonitorRequest request) {
        validateCron(request.getCronExpression());
        Monitor saved = monitorRepository.save(toEntity(request));
        monitorScheduler.schedule(saved);
        return saved;
    }

    public Monitor updateMonitor(Long id, UpdateMonitor request) {
        validateCron(request.getCronExpression());
        Monitor existing = monitorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Monitor not found"));
        existing.setUrl(request.getUrl());
        existing.setMethod(request.getMethod());
        existing.setRequestBody(toJson(request.getRequestBody()));
        existing.setExpectedStructure(toJson(request.getExpectedStructure()));
        existing.setCronExpression(request.getCronExpression());
        Monitor saved = monitorRepository.save(existing);
        monitorScheduler.schedule(saved);
        return saved;
    }

    public Monitor deleteMonitor(Long id) {
        Monitor monitor = monitorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Monitor not found"));
        monitorScheduler.cancel(id);
        counterCache.evict(id);
        monitorRepository.delete(monitor);
        return monitor;
    }

    /**
     * Overlay in-memory counter deltas onto the DB-persisted values
     * so API responses always reflect the latest counts.
     */
    private void overlayDeltas(Monitor monitor) {
        monitor.setSuccessCount(monitor.getSuccessCount() + counterCache.getSuccessDelta(monitor.getId()));
        monitor.setFailureCount(monitor.getFailureCount() + counterCache.getFailureDelta(monitor.getId()));
    }

    private void validateCron(String cron) {
        if (!CronExpression.isValidExpression(cron)) {
            throw new IllegalArgumentException(
                    "Invalid Spring cron expression: '" + cron + "'. " +
                            "Spring crons require 6 fields: second minute hour day-of-month month day-of-week. " +
                            "Example for every hour: '0 0 * * * *'");
        }
    }

    private Monitor toEntity(MonitorRequest request) {
        return Monitor.builder()
                .url(request.getUrl())
                .method(request.getMethod())
                .requestBody(toJson(request.getRequestBody()))
                .expectedStructure(toJson(request.getExpectedStructure()))
                .cronExpression(request.getCronExpression())
                .build();
    }

    private String toJson(JsonNode node) {
        if (node == null || node.isNull())
            return null;
        try {
            return objectMapper.writeValueAsString(node);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize JSON field", e);
        }
    }
}

