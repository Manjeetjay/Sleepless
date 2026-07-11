package com.devs.sleepless;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import io.github.cdimascio.dotenv.Dotenv;

@SpringBootApplication
@EnableScheduling
public class SleeplessApplication {

	public static void main(String[] args) {
		Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
		dotenv.entries().forEach(e -> {
			if (System.getenv(e.getKey()) == null) {
				System.setProperty(e.getKey(), e.getValue());
			}
		});

		SpringApplication.run(SleeplessApplication.class, args);
	}

}
