package com.HEJZ.HEJZ_back.domain.community.feed.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

@Slf4j
@Service
public class RateLimitService {

    private final Map<Long, Queue<LocalDateTime>> requestHistory = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS = 5;
    private static final int TIME_WINDOW_MINUTES = 1;

    public boolean allowRequest(Long userId) {
        Queue<LocalDateTime> requests = requestHistory.computeIfAbsent(userId, k -> new ConcurrentLinkedQueue<>());
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneMinuteAgo = now.minusMinutes(TIME_WINDOW_MINUTES);

        requests.removeIf(time -> time.isBefore(oneMinuteAgo));

        log.info("===== Rate Limit Check =====");
        log.info("userId: {}", userId);
        log.info("현재 요청 수: {}/{}", requests.size(), MAX_REQUESTS);
        log.info("============================");

        if (requests.size() >= MAX_REQUESTS) {
            log.warn("!!! userId={} Rate Limit 초과! 요청 거부됨 !!!", userId);
            return false;
        }

        requests.add(now);
        log.info("요청 허용됨. 새로운 카운트: {}/{}", requests.size(), MAX_REQUESTS);
        return true;
    }

    public void cleanup() {
        LocalDateTime oneMinuteAgo = LocalDateTime.now().minusMinutes(TIME_WINDOW_MINUTES);

        requestHistory.values().forEach(queue ->
                queue.removeIf(time -> time.isBefore(oneMinuteAgo))
        );

        requestHistory.entrySet().removeIf(entry -> entry.getValue().isEmpty());
    }
}