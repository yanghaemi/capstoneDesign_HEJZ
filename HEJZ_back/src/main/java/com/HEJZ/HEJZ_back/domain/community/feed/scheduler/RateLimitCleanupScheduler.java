package com.HEJZ.HEJZ_back.domain.community.feed.scheduler;

import com.HEJZ.HEJZ_back.domain.community.feed.service.RateLimitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitCleanupScheduler {

    private final RateLimitService rateLimitService;

    // 매 1분마다 실행
    @Scheduled(cron = "0 * * * * *")
    public void cleanupOldRequests() {
        log.info("Rate limit 정리 작업 시작");
        rateLimitService.cleanup();
        log.info("Rate limit 정리 작업 완료");
    }
}