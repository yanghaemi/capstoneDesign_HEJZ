package com.HEJZ.HEJZ_back.domain.community.feed.repository;

import com.HEJZ.HEJZ_back.domain.community.feed.entity.Feed;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface FeedRepository extends JpaRepository<Feed, Long> {

    /**
     * 최신순(Keyset 페이징)으로 유저 피드 조회
     */
    @Query("""
        SELECT f FROM Feed f
        WHERE f.user.id = :userId
          AND f.isDeleted = false
          AND (
               :cursorCreatedAt IS NULL
               OR (f.createdAt < :cursorCreatedAt)
               OR (f.createdAt = :cursorCreatedAt AND f.id < :cursorId)
          )
        ORDER BY f.createdAt DESC, f.id DESC
        """)
    List<Feed> findMyFeeds(
            @Param("userId") Long userId,
            @Param("cursorCreatedAt") LocalDateTime cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable
    );
}
