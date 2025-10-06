package com.HEJZ.HEJZ_back.domain.community.feed.dto;

public record MediaCreate(
        String url,
        MediaType type,          // IMAGE | VIDEO
        String thumbnailUrl,
        Integer durationMs,
        String mimeType
) {}