package com.devs.sleepless.config;

import io.github.cdimascio.dotenv.Dotenv;

public class DotenvConfig {

    public static void initialize() {
        Dotenv.configure()
                .directory("./")
                .ignoreIfMissing()
                .systemProperties()
                .load();

        System.out.println("✓ Dotenv initialized successfully");
    }
}
