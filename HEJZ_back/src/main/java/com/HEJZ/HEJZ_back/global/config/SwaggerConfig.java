package com.HEJZ.HEJZ_back.global.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("HEJZ API 문서")
                        .version("1.0")
                        .description("가사 기반 감정 분석 및 안무 추천 API 문서"));
    }
}
