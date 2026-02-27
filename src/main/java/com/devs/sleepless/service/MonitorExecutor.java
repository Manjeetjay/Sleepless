package com.devs.sleepless.service;

import java.util.Set;

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

    private static final Set<String> BODY_METHODS = Set.of("POST", "PUT", "PATCH");

    private final WebClient webClient = WebClient.create();
    private final MonitorRepository monitorRepository;
    private final ObjectMapper objectMapper;

    public void execute(Monitor monitor) throws Exception {

        WebClient.RequestBodySpec requestSpec = webClient
                .method(HttpMethod.valueOf(monitor.getMethod()))
                .uri(monitor.getUrl());

        WebClient.ResponseSpec responseSpec;
        String method = monitor.getMethod().toUpperCase();
        if (BODY_METHODS.contains(method) && monitor.getRequestBody() != null) {
            // Parse stored JSON string and send as body
            JsonNode bodyNode = objectMapper.readTree(monitor.getRequestBody());
            responseSpec = requestSpec.bodyValue(bodyNode).retrieve();
        } else {
            responseSpec = requestSpec.retrieve();
        }

        JsonNode response = responseSpec
                .bodyToMono(JsonNode.class)
                .block();

        // Parse stored expected structure string for comparison
        JsonNode expected = monitor.getExpectedStructure() != null
                ? objectMapper.readTree(monitor.getExpectedStructure())
                : null;

        boolean valid = JsonComparator.compare(expected, response);

        if (valid) {
            monitor.setSuccessCount(monitor.getSuccessCount() + 1);
        } else {
            monitor.setFailureCount(monitor.getFailureCount() + 1);
        }

        monitorRepository.save(monitor);
    }
}
