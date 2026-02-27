package com.devs.sleepless;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SleeplessApplication {

	public static void main(String[] args) {
		SpringApplication.run(SleeplessApplication.class, args);
	}

}
