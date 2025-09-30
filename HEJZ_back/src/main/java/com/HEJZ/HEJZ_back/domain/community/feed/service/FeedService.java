package com.HEJZ.HEJZ_back.domain.community.feed.service;

import com.HEJZ.HEJZ_back.domain.community.feed.dto.FeedCreateRequest;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.FeedItemDto;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.FeedListResponse;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.ImageDto;
import com.HEJZ.HEJZ_back.domain.community.feed.entity.Feed;
import com.HEJZ.HEJZ_back.domain.community.feed.entity.FeedMedia;
import com.HEJZ.HEJZ_back.domain.community.feed.repository.FeedRepository;
import com.HEJZ.HEJZ_back.domain.community.user.entity.UserEntity;
import com.HEJZ.HEJZ_back.domain.community.user.repository.UserRepository;
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

    private static final DateTimeFormatter CURSOR_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @Transactional
    public FeedItemDto createFeed(Long userId, FeedCreateRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Feed feed = Feed.builder()
                .user(user)
                .content(request.content())
                .createdAt(LocalDateTime.now())
                .build();

        List<FeedMedia> medias = new ArrayList<>();
        if (request.imageUrls() != null) {
            for (int i = 0; i < request.imageUrls().size(); i++) {
                medias.add(FeedMedia.builder()
                        .feed(feed)
                        .url(request.imageUrls().get(i))
                        .ord(i)
                        .build());
            }
        }
        feed.setImages(medias);

        Feed saved = feedRepository.save(feed);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public FeedListResponse getMyFeeds(Long userId, int limit, String cursor) {
        LocalDateTime cursorCreatedAt = null;
        Long cursorId = null;

        if (cursor != null && cursor.contains("_") && !"null".equalsIgnoreCase(cursor)) {
            String[] parts = cursor.split("_", 2);
            if (parts.length == 2) {
                String ts = parts[0];
                if (ts.length() > 19) ts = ts.substring(0, 19); // yyyy-MM-ddTHH:mm:ss
                try {
                    cursorCreatedAt = LocalDateTime.parse(ts, CURSOR_FMT);
                    cursorId = Long.parseLong(parts[1]);
                } catch (Exception e) {
                    throw new RuntimeException("Invalid cursor: " + cursor, e);
                }
            }
        }

        List<Feed> feeds = feedRepository.findMyFeeds(
                userId,
                cursorCreatedAt,
                cursorId,
                PageRequest.of(0, Math.max(1, Math.min(100, limit)))
        );

        String nextCursor = null;
        if (!feeds.isEmpty()) {
            Feed last = feeds.get(feeds.size() - 1);
            // 응답 커서는 초 단위까지만
            String ts = last.getCreatedAt().format(CURSOR_FMT);
            nextCursor = ts + "_" + last.getId();
        }

        List<FeedItemDto> items = feeds.stream()
                .map(this::toDto)
                .toList();

        return new FeedListResponse(items, nextCursor);
    }

    @Transactional
    public void deleteFeed(Long userId, Long feedId) {
        Feed feed = feedRepository.findById(feedId)
                .orElseThrow(() -> new RuntimeException("Feed not found"));
        if (!feed.getUser().getId().equals(userId)) {
            throw new RuntimeException("권한 없음");
        }
        feed.setDeleted(true);
    }

    private FeedItemDto toDto(Feed feed) {
        List<ImageDto> imgs = feed.getImages().stream()
                .sorted(Comparator.comparingInt(FeedMedia::getOrd))  // ← 여기!
                .map(m -> new ImageDto(m.getUrl(), m.getOrd()))
                .toList();

        return new FeedItemDto(
                feed.getId(),
                feed.getUser().getId(),
                feed.getContent(),
                imgs,
                feed.getCreatedAt()
        );
    }

}
