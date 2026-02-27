package com.devs.sleepless.dto;

import tools.jackson.databind.JsonNode;
import lombok.Data;

@Data
public class MonitorRequest {

    private String url;
    private String method;
    private JsonNode requestBody;
    private JsonNode expectedStructure;
    private String cronExpression;
}
