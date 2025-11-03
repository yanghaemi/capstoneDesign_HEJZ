package com.HEJZ.HEJZ_back.domain.community.feed.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.HEJZ.HEJZ_back.domain.music.entity.SavedSong;

public record FeedItemDto(
        Long id,
        Long userId,
        String content,
        List<MediaDto> media,
        SavedSong song,
        String emotion,
        String genre,
        LocalDateTime createdAt) {
}
