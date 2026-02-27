package com.devs.sleepless.service;

import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.devs.sleepless.model.Monitor;
import com.devs.sleepless.repository.MonitorRepository;

import lombok.RequiredArgsConstructor;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
public class MonitorExecutor {

    private static final Logger log = LoggerFactory.getLogger(MonitorExecutor.class);
    private static final Set<String> BODY_METHODS = Set.of("POST", "PUT", "PATCH");

    private final WebClient webClient = WebClient.create();
    private final MonitorRepository monitorRepository;
    private final ObjectMapper objectMapper;

    public void execute(Monitor monitor) {
        log.info("[CRON] Pinging monitor id={} | url={} | method={}", monitor.getId(), monitor.getUrl(),
                monitor.getMethod());

        try {
            WebClient.RequestBodySpec requestSpec = webClient
                    .method(HttpMethod.valueOf(monitor.getMethod()))
                    .uri(monitor.getUrl());

            WebClient.ResponseSpec responseSpec;
            String method = monitor.getMethod().toUpperCase();
            if (BODY_METHODS.contains(method) && monitor.getRequestBody() != null) {
                JsonNode bodyNode = objectMapper.readTree(monitor.getRequestBody());
                responseSpec = requestSpec.bodyValue(bodyNode).retrieve();
            } else {
                responseSpec = requestSpec.retrieve();
            }

            JsonNode response = responseSpec
                    .bodyToMono(JsonNode.class)
                    .block();

            JsonNode expected = monitor.getExpectedStructure() != null
                    ? objectMapper.readTree(monitor.getExpectedStructure())
                    : null;

            boolean valid = JsonComparator.compare(expected, response);

            if (valid) {
                monitor.setSuccessCount(monitor.getSuccessCount() + 1);
                log.info("[CRON] SUCCESS monitor id={} | url={} | successCount={} | failureCount={}",
                        monitor.getId(), monitor.getUrl(), monitor.getSuccessCount(), monitor.getFailureCount());
            } else {
                monitor.setFailureCount(monitor.getFailureCount() + 1);
                log.warn(
                        "[CRON] FAILURE monitor id={} | url={} | response did not match expected structure | successCount={} | failureCount={}",
                        monitor.getId(), monitor.getUrl(), monitor.getSuccessCount(), monitor.getFailureCount());
            }

            monitorRepository.save(monitor);

        } catch (Exception e) {
            monitor.setFailureCount(monitor.getFailureCount() + 1);
            monitorRepository.save(monitor);
            log.error("[CRON] ERROR monitor id={} | url={} | error={} | successCount={} | failureCount={}",
                    monitor.getId(), monitor.getUrl(), e.getMessage(), monitor.getSuccessCount(),
                    monitor.getFailureCount());
        }
    }
}
