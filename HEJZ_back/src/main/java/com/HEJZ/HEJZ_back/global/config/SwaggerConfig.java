package com.HEJZ.HEJZ_back.global.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("HEJZ API 문서")
                        .description("AI 기반 감정 분석 안무 추천 프로젝트의 Swagger 문서입니다.")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("HEJZ 팀")
                                .email("hemi@example.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("http://springdoc.org")));
    }
}
