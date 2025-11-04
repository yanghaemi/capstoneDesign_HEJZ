package com.HEJZ.HEJZ_back.domain.community.feed.service;

import com.HEJZ.HEJZ_back.domain.community.feed.dto.FeedCreateRequest;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.FeedItemDto;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.FeedListResponse;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.MediaDto;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.MediaType;
import com.HEJZ.HEJZ_back.domain.community.feed.entity.FeedEntity;
import com.HEJZ.HEJZ_back.domain.community.feed.entity.FeedMediaEntity;
import com.HEJZ.HEJZ_back.domain.community.feed.repository.FeedRepository;
import com.HEJZ.HEJZ_back.domain.community.recommendation.repository.UserPrefScoreRepository;
import com.HEJZ.HEJZ_back.domain.community.user.entity.UserEntity;
import com.HEJZ.HEJZ_back.domain.community.user.repository.UserRepository;
import com.HEJZ.HEJZ_back.domain.music.dto.SavedSongDTO;
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
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FeedService {

    private final FeedRepository feedRepository;
    private final UserRepository userRepository;
    private final SavedSongRepository songRepository;
    private final UserPrefScoreRepository userPrefScoreRepository;

    private static final DateTimeFormatter CURSOR_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    // 가중치 크기================
    private static final int RERANK_WINDOW_MULTIPLIER = 3; // limit의 3배만 임시로 가져와 재랭크
    private static final double W_AUTHOR = 1.0;
    private static final double W_GENRE = 0.7;
    private static final double W_EMOTION = 0.4;
    private static final double W_PREF = 0.7; // 취향 비중
    private static final double W_RECENCY = 1.0 - W_PREF; // 최신 비중
    private static final double RECENCY_TAU_SECONDS = 60 * 60 * 24; // 1일 감쇠
    // ==========================

    // =========================
    // 가중치 적용
    // =========================
    private double recencyScore(LocalDateTime createdAt) {
        double ageSec = java.time.Duration.between(createdAt, LocalDateTime.now()).getSeconds();
        return Math.exp(-ageSec / RECENCY_TAU_SECONDS);
    }

    private double computePrefScore(FeedEntity f, Map<String, Double> prefMap) {
        double author = prefMap.getOrDefault("author: " + f.getUser().getId(), 0.0);
        double genre = (f.getGenre() != null) ? prefMap.getOrDefault("genre: " + f.getGenre(), 0.0) : 0.0;
        double emo = (f.getEmotion() != null) ? prefMap.getOrDefault("emotion:" + f.getEmotion(), 0.0) : 0.0;
        return W_AUTHOR * author + W_GENRE * genre + W_EMOTION * emo;
    }

    private Map<String, Double> loadPrefMap(Long userId, List<FeedEntity> feeds) {
        Set<String> keys = new HashSet<>();
        for (var f : feeds) {
            keys.add("author: " + f.getUser().getId());
            if (f.getGenre() != null)
                keys.add("genre:" + f.getGenre());
            if (f.getEmotion() != null)
                keys.add("emotion: " + f.getEmotion());
        }

        var rows = userPrefScoreRepository.findAllByUserIdAndKeyIn(userId, keys);
        Map<String, Double> map = new HashMap<>();
        for (var r : rows)
            map.put(r.getKey(), r.getScore());
        return map;

    }

    private FeedListResponse reRankAndBuild(List<FeedEntity> feeds, Long userId, int limit) {
        if (feeds.isEmpty())
            return buildListResponse(feeds);

        var prefMap = loadPrefMap(userId, feeds);

        // 점수 계산 후 재정렬 (동점 안정화 위해 createdAt desc, id desc tie-breaker)
        feeds.sort((a, b) -> {
            double aScore = W_PREF * computePrefScore(a, prefMap) + W_RECENCY * recencyScore(a.getCreatedAt());
            double bScore = W_PREF * computePrefScore(b, prefMap) + W_RECENCY * recencyScore(b.getCreatedAt());
            if (aScore != bScore)
                return Double.compare(bScore, aScore); // desc
            int t = b.getCreatedAt().compareTo(a.getCreatedAt()); // 최신 우선
            return (t != 0) ? t : Long.compare(b.getId(), a.getId());
        });

        // 최종 limit만 반영
        List<FeedEntity> page = feeds.size() > limit ? feeds.subList(0, limit) : feeds;
        return buildListResponse(page);
    }

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

        // 1차: 기존 키셋으로 최근순 가져오되, 재랭크 윈도우만큼 더 가져오기
        int window = clamp(limit, 1, 100) * RERANK_WINDOW_MULTIPLIER;

        List<FeedEntity> feeds = feedRepository.findTimelineFeeds(
                userId,
                c.createdAt(),
                c.id(),
                PageRequest.of(0, window));

        // 2차: 취향 점수와 최신성 블렌딩으로 재정렬 후 limit만큼 잘라서 응답
        return reRankAndBuild(feeds, userId, clamp(limit, 1, 100));
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

        SavedSongDTO songDto = null;
        if (feed.getSong() != null) {
            SavedSong song = feed.getSong();
            songDto = new SavedSongDTO(
                    song.getTitle(),
                    song.getTaskId(),
                    song.getAudioId(),
                    song.getAudioUrl(),
                    song.getSourceAudioUrl(),
                    song.getStreamAudioUrl(),
                    song.getSourceStreamAudioUrl(),
                    song.getPrompt(),
                    song.getLyricsJson(),
                    song.getPlainLyrics());
        }

        return new FeedItemDto(
                feed.getId(),
                feed.getUser().getId(),
                feed.getContent(),
                mediaDtos,
                songDto,
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
