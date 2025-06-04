package com.HEJZ.HEJZ_back.global.config;

import com.HEJZ.HEJZ_back.global.util.CsvLoader;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {

    @Bean
    public CsvLoader csvLoader() {
        CsvLoader loader = new CsvLoader();
        loader.init(); // @PostConstruct 대신 수동 초기화
        return loader;
    }
}
