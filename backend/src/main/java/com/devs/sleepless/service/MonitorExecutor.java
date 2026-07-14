package com.devs.sleepless.service;

import java.time.Duration;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.devs.sleepless.model.Monitor;

import lombok.RequiredArgsConstructor;
import reactor.util.retry.Retry;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
public class MonitorExecutor {

    private static final Logger log = LoggerFactory.getLogger(MonitorExecutor.class);
    private static final Set<String> BODY_METHODS = Set.of("POST", "GET");

    private final WebClient webClient = WebClient.create();
    private final CounterCacheService counterCache;
    private final ObjectMapper objectMapper;

    public void execute(Monitor monitor) {
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
                    .retryWhen(Retry.backoff(3, Duration.ofSeconds(2)))
                    .block();

            JsonNode expected = monitor.getExpectedStructure() != null
                    ? objectMapper.readTree(monitor.getExpectedStructure())
                    : null;

            boolean valid = JsonComparator.compare(expected, response);

            if (valid) {
                counterCache.incrementSuccess(monitor.getId());
                monitor.setSuccessCount(monitor.getSuccessCount() + 1);
                log.info("[CRON] SUCCESS monitor url={} | successCount={} | failureCount={}",
                        monitor.getUrl(), monitor.getSuccessCount(), monitor.getFailureCount());
            } else {
                counterCache.incrementFailure(monitor.getId());
                monitor.setFailureCount(monitor.getFailureCount() + 1);
                log.warn(
                        "[CRON] FAILURE monitor url={} | response did not match expected structure | failureCount={}",
                        monitor.getUrl(), monitor.getFailureCount());
            }

        } catch (Exception e) {
            counterCache.incrementFailure(monitor.getId());
            monitor.setFailureCount(monitor.getFailureCount() + 1);
            log.error("[CRON] ERROR monitor url={} | error={}", monitor.getUrl(), e.getMessage());
        }
    }
}

