package com.devs.sleepless;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class SleeplessApplicationTests {

	static {
		com.devs.sleepless.config.DotenvConfig.initialize();
	}

	@Test
	void contextLoads() {
	}

}
