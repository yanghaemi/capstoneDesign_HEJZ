package com.HEJZ.HEJZ_back.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadDir = System.getProperty("user.home") + "/uploads/";
        registry.addResourceHandler("/static/**")
                .addResourceLocations("file:" + uploadDir);
    }
}
