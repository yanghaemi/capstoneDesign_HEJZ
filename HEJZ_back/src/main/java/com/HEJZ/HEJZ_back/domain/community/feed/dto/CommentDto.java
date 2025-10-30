package com.HEJZ.HEJZ_back.domain.community.feed.dto;

import java.time.LocalDateTime;

public record CommentDto(
        Long id,
        String comment,
        LocalDateTime createdAt,
        Long userId,
        String username,
        Long likeCount) {
}