package com.devs.sleepless.service;

import tools.jackson.databind.JsonNode;

public class JsonComparator {

    public static boolean compare(JsonNode expected, JsonNode actual) {
        if (expected == null || expected.isNull())
            return true;
        if (actual == null || actual.isNull())
            return false;
        return sameStructure(expected, actual);
    }

    private static boolean sameStructure(JsonNode a, JsonNode b) {
        if (b == null || b.isNull())
            return false;

        if (a.isObject()) {
            if (!b.isObject())
                return false;
            for (String field : a.propertyNames()) {
                if (!b.has(field))
                    return false;

                if (!sameStructure(a.get(field), b.get(field)))
                    return false;
            }
            return true;
        }

        if (a.isArray()) {
            return b.isArray();
        }

        return true;
    }
}
