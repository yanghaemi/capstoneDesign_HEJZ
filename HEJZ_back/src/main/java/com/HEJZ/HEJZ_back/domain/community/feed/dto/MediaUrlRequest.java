package com.HEJZ.HEJZ_back.domain.community.feed.dto;

public record MediaUrlRequest(
        String url,
        MediaType type,       // null이면 서버에서 IMAGE로 기본 처리
        String thumbnailUrl,
        Integer durationMs,
        String mimeType
){}
