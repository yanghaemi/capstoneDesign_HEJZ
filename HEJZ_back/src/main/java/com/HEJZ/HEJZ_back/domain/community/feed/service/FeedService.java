package com.HEJZ.HEJZ_back.domain.community.feed.service;

import com.HEJZ.HEJZ_back.domain.community.feed.dto.FeedCreateRequest;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.FeedItemDto;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.FeedListResponse;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.FeedScoreDebugDto;
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
import com.HEJZ.HEJZ_back.global.response.ApiResponse;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
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
    // private double recencyScore(LocalDateTime createdAt) {
    // double ageSec = java.time.Duration.between(createdAt,
    // LocalDateTime.now()).getSeconds();
    // return Math.exp(-ageSec / RECENCY_TAU_SECONDS);
    // }

    // private double computePrefScore(FeedEntity f, Map<String, Double> prefMap) {
    // double author = prefMap.getOrDefault("author: " + f.getUser().getId(), 0.0);
    // double genre = (f.getGenre() != null) ? prefMap.getOrDefault("genre: " +
    // f.getGenre(), 0.0) : 0.0;
    // double emo = (f.getEmotion() != null) ? prefMap.getOrDefault("emotion:" +
    // f.getEmotion(), 0.0) : 0.0;
    // return W_AUTHOR * author + W_GENRE * genre + W_EMOTION * emo;
    // }

    private Map<String, Double> loadPrefMap(Long userId, List<FeedEntity> feeds) {
        Set<String> keys = new HashSet<>();
        for (var f : feeds) {
            keys.add("author:" + f.getUser().getId());
            if (f.getGenre() != null)
                keys.add("genre:" + f.getGenre());
            if (f.getEmotion() != null)
                keys.add("emotion:" + f.getEmotion());
        }

        var rows = userPrefScoreRepository.findAllByUserIdAndKeyIn(userId, keys);
        Map<String, Double> map = new HashMap<>();
        for (var r : rows)
            map.put(r.getKey(), r.getScore());
        return map;
    }

    private FeedListResponse reRankAndBuild(List<FeedEntity> feeds, Long userId,
            Integer limit) {
        if (feeds.isEmpty()) {
            return buildListResponse(Collections.emptyList());
        }

        Map<String, Double> prefMap = loadPrefMap(userId, feeds);

        List<FeedScoreDebugDto> debugFeeds = feeds.stream()
                .map(feed -> calculateScoreWithDebug(feed, prefMap))
                .sorted((a, b) -> {
                    // 기존 로직과 동일한 정렬
                    if (!a.getTotalScore().equals(b.getTotalScore())) {
                        return Double.compare(b.getTotalScore(), a.getTotalScore()); // desc
                    }
                    int t = b.getCreatedAt().compareTo(a.getCreatedAt()); // 최신 우선
                    return (t != 0) ? t : Long.compare(b.getFeedId(), a.getFeedId());
                })
                .limit(limit != null ? limit : feeds.size())
                .toList();

        // 최종 limit만 반영
        List<FeedScoreDebugDto> page = debugFeeds.size() > limit ? debugFeeds.subList(0, limit) : debugFeeds;
        return buildListResponse(page);
    }

    private List<FeedScoreDebugDto> getTimeLine(Long userId, Integer limit) {
        List<FeedEntity> feeds = feedRepository.findAllNotDeleted();

        if (feeds.isEmpty()) {
            return Collections.emptyList();
        }

        // 선호도 맵 로드
        Map<String, Double> prefMap = loadPrefMap(userId, feeds);

        // 점수 계산 및 DTO 변환
        List<FeedScoreDebugDto> scoredFeeds = feeds.stream()
                .map(feed -> calculateScoreWithDebug(feed, prefMap))
                .sorted((a, b) -> {
                    // 기존 로직과 동일한 정렬
                    if (!a.getTotalScore().equals(b.getTotalScore())) {
                        return Double.compare(b.getTotalScore(), a.getTotalScore()); // desc
                    }
                    int t = b.getCreatedAt().compareTo(a.getCreatedAt()); // 최신 우선
                    return (t != 0) ? t : Long.compare(b.getFeedId(), a.getFeedId());
                })
                .limit(limit != null ? limit : feeds.size())
                .toList();

        return scoredFeeds;
    }

    public List<FeedScoreDebugDto> getTimelineFeedsWithScores(Long userId, Integer limit) {
        // 피드 조회 (기존 로직)
        List<FeedScoreDebugDto> debugFeeds = getTimeLine(userId, limit);

        // 콘솔에 출력
        printScoreDebug(debugFeeds, userId);

        return debugFeeds;
    }

    private FeedScoreDebugDto calculateScoreWithDebug(
            FeedEntity feed,
            Map<String, Double> prefMap) {

        // 작성자 점수
        double authorScore = prefMap.getOrDefault("author:" + feed.getUser().getId(), 0.0);
        double authorWeighted = W_AUTHOR * authorScore;

        // 장르 점수
        double genreScore = (feed.getGenre() != null)
                ? prefMap.getOrDefault("genre:" + feed.getGenre(), 0.0)
                : 0.0;
        double genreWeighted = W_GENRE * genreScore;

        // 감정 점수
        double emotionScore = (feed.getEmotion() != null)
                ? prefMap.getOrDefault("emotion:" + feed.getEmotion(), 0.0)
                : 0.0;
        double emotionWeighted = W_EMOTION * emotionScore;

        // 선호도 총점
        double prefScore = authorWeighted + genreWeighted + emotionWeighted;
        double prefWeightedScore = W_PREF * prefScore;

        // 최신성 점수
        long ageSeconds = Duration.between(feed.getCreatedAt(), LocalDateTime.now()).getSeconds();
        double recencyScore = Math.exp(-ageSeconds / RECENCY_TAU_SECONDS);
        double recencyWeightedScore = W_RECENCY * recencyScore;

        // 최종 점수
        double totalScore = prefWeightedScore + recencyWeightedScore;

        return FeedScoreDebugDto.builder()
                .feedId(feed.getId())
                .content(feed.getContent())
                .authorId(feed.getUser().getId())
                .authorName(feed.getUser().getUsername())
                .genre(feed.getGenre())
                .emotion(feed.getEmotion())
                .createdAt(feed.getCreatedAt())
                .ageSeconds(ageSeconds)
                .totalScore(totalScore)
                .breakdown(FeedScoreDebugDto.ScoreBreakdown.builder()
                        .prefScore(prefScore)
                        .prefWeightedScore(prefWeightedScore)
                        .authorScore(authorScore)
                        .authorWeighted(authorWeighted)
                        .genreScore(genreScore)
                        .genreWeighted(genreWeighted)
                        .emotionScore(emotionScore)
                        .emotionWeighted(emotionWeighted)
                        .recencyScore(recencyScore)
                        .recencyWeightedScore(recencyWeightedScore)
                        .build())
                .build();
    }

    private void printScoreDebug(List<FeedScoreDebugDto> feeds, Long userId) {
        System.out.println("\n" + "=".repeat(120));
        System.out.println("📊 FEED RECOMMENDATION SCORES DEBUG - User ID: " + userId);
        System.out.println("📌 Algorithm: W_PREF(0.7) × PrefScore + W_RECENCY(0.3) × RecencyScore");
        System.out.println("📌 PrefScore = W_AUTHOR(1.0)×author + W_GENRE(0.7)×genre + W_EMOTION(0.4)×emotion");
        System.out.println("=".repeat(120));

        for (int i = 0; i < feeds.size(); i++) {
            FeedScoreDebugDto feed = feeds.get(i);
            FeedScoreDebugDto.ScoreBreakdown b = feed.getBreakdown();

            String ageStr = formatAge(feed.getAgeSeconds());

            System.out.printf("\n[순위 %d] Feed ID: %d | Author: %s (ID: %d)\n",
                    i + 1, feed.getFeedId(), feed.getAuthorName(), feed.getAuthorId());
            System.out.printf("         Content: %s\n",
                    feed.getContent().length() > 70
                            ? feed.getContent().substring(0, 67) + "..."
                            : feed.getContent());
            System.out.printf("         Genre: %-15s | Emotion: %-10s | Age: %s\n",
                    feed.getGenre() != null ? feed.getGenre() : "null",
                    feed.getEmotion() != null ? feed.getEmotion() : "null",
                    ageStr);
            System.out.println("         " + "-".repeat(100));
            System.out.printf("         🎯 TOTAL SCORE: %.6f\n", feed.getTotalScore());
            System.out.println("         " + "-".repeat(100));

            // 선호도 점수 (70%)
            System.out.printf("         📊 PREFERENCE (70%%) → %.6f × 0.7 = %.6f\n",
                    b.getPrefScore(), b.getPrefWeightedScore());
            System.out.printf("            ├─ Author   : %.4f × 1.0 = %.6f\n",
                    b.getAuthorScore(), b.getAuthorWeighted());
            System.out.printf("            ├─ Genre    : %.4f × 0.7 = %.6f\n",
                    b.getGenreScore(), b.getGenreWeighted());
            System.out.printf("            └─ Emotion  : %.4f × 0.4 = %.6f\n",
                    b.getEmotionScore(), b.getEmotionWeighted());

            // 최신성 점수 (30%)
            System.out.printf("         ⏰ RECENCY (30%%)    → %.6f × 0.3 = %.6f\n",
                    b.getRecencyScore(), b.getRecencyWeightedScore());
            System.out.printf("            └─ Age: %d seconds (decay: e^(-age/86400))\n",
                    feed.getAgeSeconds());
        }

        System.out.println("\n" + "=".repeat(120));
        System.out.println("💡 TIP: 높은 점수 = 선호도 높음 + 최신 게시물");
        System.out.println("=".repeat(120) + "\n");
    }

    private String formatAge(long seconds) {
        if (seconds < 60) {
            return seconds + "초 전";
        } else if (seconds < 3600) {
            return (seconds / 60) + "분 전";
        } else if (seconds < 86400) {
            return (seconds / 3600) + "시간 전";
        } else {
            return (seconds / 86400) + "일 전";
        }
    }

    // =========================
    // Create
    // =========================
    @Transactional
    public FeedItemDto createFeed(Long userId, FeedCreateRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FeedEntity feed = FeedEntity.builder()
                .user(user)
                .content(request.content())
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
    // Read: My feeds (pagination)
    // =========================
    @Transactional(readOnly = true)
    public FeedListResponse getMyFeeds(Long userId, int limit, String cursor) {
        Cursor c = parseCursor(cursor);

        int window = clamp(limit, 1, 100) * RERANK_WINDOW_MULTIPLIER;

        List<FeedEntity> feeds = feedRepository.findMyFeeds(
                userId,
                c.createdAt(),
                c.id(),
                PageRequest.of(0, window));

        return reRankAndBuild(feeds, userId, clamp(limit, 1, 100));

    }

    // =========================
    // Read: Timeline 팔로워
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
    // Read: Global (everyone, latest)
    // =========================
    @Transactional(readOnly = true)
    public FeedListResponse getGlobalFeeds(Long userId, int limit, String cursor) {
        Cursor c = parseCursor(cursor);

        int window = clamp(limit, 1, 100) * RERANK_WINDOW_MULTIPLIER;

        List<FeedEntity> feeds = feedRepository.findGlobalFeeds(
                userId,
                c.createdAt(),
                c.id(),
                PageRequest.of(0, window));

        return reRankAndBuild(feeds, userId, clamp(limit, 1, 100));
    }

    public ApiResponse<Object> getFeed(Long feedId) {
        try {
            FeedEntity feed = feedRepository.findById(feedId).orElseThrow(() -> new RuntimeException("피드를 찾지 못함."));

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

            FeedItemDto dto = new FeedItemDto(
                    feed.getId(),
                    feed.getUser().getId(),
                    feed.getContent(),
                    mediaDtos,
                    feed.getEmotion(),
                    feed.getGenre(),
                    feed.getCreatedAt());

            return new ApiResponse<Object>(200, dto, "게시글 조회 성공");
        } catch (Exception e) {
            return new ApiResponse<Object>(500, null, "게시글 조회 실패");
        }
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
                feed.getEmotion(),
                feed.getGenre(),
                feed.getCreatedAt());
    }

    private String toCursor(FeedScoreDebugDto last) {
        String ts = last.getCreatedAt().format(CURSOR_FMT); // yyyy-MM-ddTHH:mm:ss
        return ts + "_" + last.getFeedId();
    }

    private FeedListResponse buildListResponse(List<FeedScoreDebugDto> feeds) {
        String nextCursor = null;
        if (!feeds.isEmpty()) {
            nextCursor = toCursor(feeds.get(feeds.size() - 1));
        }
        return new FeedListResponse(feeds, nextCursor);
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
