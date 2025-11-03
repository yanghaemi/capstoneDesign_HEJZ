package com.HEJZ.HEJZ_back.domain.community.feed.service;

import com.HEJZ.HEJZ_back.domain.community.feed.dto.FeedCreateRequest;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.FeedItemDto;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.FeedListResponse;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.MediaDto;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.MediaType;
import com.HEJZ.HEJZ_back.domain.community.feed.entity.FeedEntity;
import com.HEJZ.HEJZ_back.domain.community.feed.entity.FeedMediaEntity;
import com.HEJZ.HEJZ_back.domain.community.feed.repository.FeedRepository;
import com.HEJZ.HEJZ_back.domain.community.user.entity.UserEntity;
import com.HEJZ.HEJZ_back.domain.community.user.repository.UserRepository;
import com.HEJZ.HEJZ_back.domain.music.controller.SongController;
import com.HEJZ.HEJZ_back.domain.music.entity.SavedSong;
import com.HEJZ.HEJZ_back.domain.music.repository.SavedSongRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FeedService {

    private final FeedRepository feedRepository;
    private final UserRepository userRepository;
    private final SavedSongRepository songRepository;

    private static final DateTimeFormatter CURSOR_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    // =========================
    // Create
    // =========================
    @Transactional
    public FeedItemDto createFeed(Long userId, FeedCreateRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SavedSong song = songRepository.findById(request.songId())
                .orElseThrow(() -> new RuntimeException("노래를 찾지 못했습니다."));

        FeedEntity feed = FeedEntity.builder()
                .user(user)
                .content(request.content())
                .song(song)
                .genre(request.genre())
                .emotion(request.emotion())
                .createdAt(LocalDateTime.now())
                .build();

        List<FeedMediaEntity> media = new ArrayList<>();

        // 신규 포맷 우선 (media[])
        if (request.media() != null && !request.media().isEmpty()) {
            for (int i = 0; i < request.media().size(); i++) {
                var m = request.media().get(i);
                media.add(FeedMediaEntity.builder()
                        .feed(feed)
                        .url(m.url())
                        .ord(i)
                        .type(m.type() == null ? MediaType.IMAGE : m.type())
                        .thumbnailUrl(m.thumbnailUrl())
                        .durationMs(m.durationMs())
                        .mimeType(m.mimeType())
                        .build());
            }
        }
        // 레거시 호환 (imageUrls[])
        else if (request.imageUrls() != null && !request.imageUrls().isEmpty()) {
            for (int i = 0; i < request.imageUrls().size(); i++) {
                media.add(FeedMediaEntity.builder()
                        .feed(feed)
                        .url(request.imageUrls().get(i))
                        .ord(i)
                        .type(MediaType.IMAGE)
                        .build());
            }
        }

        feed.setImages(media);
        FeedEntity saved = feedRepository.save(feed);
        return toDto(saved);
    }

    // =========================
    // Read: My feeds (keyset)
    // =========================
    @Transactional(readOnly = true)
    public FeedListResponse getMyFeeds(Long userId, int limit, String cursor) {
        Cursor c = parseCursor(cursor);
        List<FeedEntity> feeds = feedRepository.findMyFeeds(
                userId,
                c.createdAt(),
                c.id(),
                PageRequest.of(0, clamp(limit, 1, 100)));
        return buildListResponse(feeds);
    }

    // =========================
    // Read: Timeline (people I follow)
    // =========================
    @Transactional(readOnly = true)
    public FeedListResponse getTimelineFeeds(Long userId, int limit, String cursor) {
        Cursor c = parseCursor(cursor);
        List<FeedEntity> feeds = feedRepository.findTimelineFeeds(
                userId,
                c.createdAt(),
                c.id(),
                PageRequest.of(0, clamp(limit, 1, 100)));
        return buildListResponse(feeds);
    }

    // =========================
    // Delete (soft delete)
    // =========================
    @Transactional
    public void deleteFeed(Long userId, Long feedId) {
        FeedEntity feed = feedRepository.findById(feedId)
                .orElseThrow(() -> new RuntimeException("Feed not found"));
        if (!feed.getUser().getId().equals(userId)) {
            throw new RuntimeException("권한 없음");
        }
        feed.setDeleted(true);
    }

    // =========================
    // DTO mapping / Cursor utils
    // =========================
    public FeedItemDto toDto(FeedEntity feed) {
        List<MediaDto> mediaDtos = feed.getImages().stream()
                .sorted(Comparator.comparingInt(FeedMediaEntity::getOrd))
                .map(m -> new MediaDto(
                        m.getUrl(),
                        m.getOrd(),
                        m.getType(),
                        m.getThumbnailUrl(),
                        m.getDurationMs(),
                        m.getMimeType()))
                .toList();

        return new FeedItemDto(
                feed.getId(),
                feed.getUser().getId(),
                feed.getContent(),
                mediaDtos,
                feed.getSong(),
                feed.getEmotion(),
                feed.getGenre(),
                feed.getCreatedAt());
    }

    private String toCursor(FeedEntity last) {
        String ts = last.getCreatedAt().format(CURSOR_FMT); // yyyy-MM-ddTHH:mm:ss
        return ts + "_" + last.getId();
    }

    private FeedListResponse buildListResponse(List<FeedEntity> feeds) {
        String nextCursor = null;
        if (!feeds.isEmpty()) {
            nextCursor = toCursor(feeds.get(feeds.size() - 1));
        }
        List<FeedItemDto> items = feeds.stream().map(this::toDto).toList();
        return new FeedListResponse(items, nextCursor);
    }

    private record Cursor(LocalDateTime createdAt, Long id) {
    }

    private Cursor parseCursor(String cursor) {
        if (cursor != null && cursor.contains("_") && !"null".equalsIgnoreCase(cursor)) {
            String[] parts = cursor.split("_", 2);
            if (parts.length == 2) {
                String ts = parts[0];
                if (ts.length() > 19)
                    ts = ts.substring(0, 19); // trim nanos if any
                try {
                    return new Cursor(LocalDateTime.parse(ts, CURSOR_FMT), Long.parseLong(parts[1]));
                } catch (Exception e) {
                    throw new RuntimeException("Invalid cursor: " + cursor, e);
                }
            }
        }
        return new Cursor(null, null);
    }

    private int clamp(int v, int lo, int hi) {
        return Math.max(lo, Math.min(hi, v));
    }
}
