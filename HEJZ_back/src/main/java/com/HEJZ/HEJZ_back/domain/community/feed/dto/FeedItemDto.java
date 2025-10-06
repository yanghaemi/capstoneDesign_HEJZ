package com.HEJZ.HEJZ_back.domain.community.feed.dto;

import java.time.LocalDateTime;
import java.util.List;

public record FeedItemDto(
        Long id,
        Long userId,
        String content,
        List<MediaDto> medias,
        LocalDateTime createdAt
) {}
