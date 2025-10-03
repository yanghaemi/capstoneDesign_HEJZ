package com.HEJZ.HEJZ_back;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.HEJZ.HEJZ_back")
@EnableScheduling
public class HejzBackApplication {

	public static void main(String[] args) {
		SpringApplication.run(HejzBackApplication.class, args);
	}

}
