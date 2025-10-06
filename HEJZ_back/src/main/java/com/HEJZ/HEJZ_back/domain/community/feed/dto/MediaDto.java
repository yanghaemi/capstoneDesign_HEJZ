package com.HEJZ.HEJZ_back.domain.community.feed.dto;

public record MediaDto(
        String url,
        int ord,
        MediaType type,
        String thumbnailUrl,
        Integer durationMs,
        String mimeType
) {}