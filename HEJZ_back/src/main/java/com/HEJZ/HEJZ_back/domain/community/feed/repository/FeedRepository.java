package com.HEJZ.HEJZ_back.domain.community.feed.repository;

import com.HEJZ.HEJZ_back.domain.community.feed.entity.Feed;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface FeedRepository extends JpaRepository<Feed, Long> {

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

    @Query("""
        SELECT f FROM Feed f
        JOIN com.HEJZ.HEJZ_back.domain.community.follow.entity.FollowEntity fol
             ON fol.following.id = f.user.id
        WHERE fol.follower.id = :userId
          AND f.isDeleted = false
          AND (
               :cursorCreatedAt IS NULL
               OR (f.createdAt < :cursorCreatedAt)
               OR (f.createdAt = :cursorCreatedAt AND f.id < :cursorId)
          )
        ORDER BY f.createdAt DESC, f.id DESC
        """)
    List<Feed> findTimelineFeeds(
            @Param("userId") Long userId,
            @Param("cursorCreatedAt") LocalDateTime cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable
    );
}
