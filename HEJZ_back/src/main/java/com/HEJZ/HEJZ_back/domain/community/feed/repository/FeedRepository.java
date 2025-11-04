package com.HEJZ.HEJZ_back.domain.community.feed.repository;

import com.HEJZ.HEJZ_back.domain.community.feed.entity.FeedEntity;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FeedRepository extends JpaRepository<FeedEntity, Long> {

    // @Query("""
    // SELECT f FROM FeedEntity f
    // WHERE f.user.id = :userId
    // AND f.isDeleted = false
    // AND (
    // :cursorCreatedAt IS NULL
    // OR (f.createdAt < :cursorCreatedAt)
    // OR (f.createdAt = :cursorCreatedAt AND f.id < :cursorId)
    // )
    // ORDER BY f.createdAt DESC, f.id DESC
    // """)
    @Query("""
            SELECT f
            FROM FeedEntity f
            INNER JOIN f.user u
            INNER JOIN FollowEntity fol
                   ON fol.following.id = f.user.id AND fol.follower.id = :userId
            LEFT JOIN UserPrefScoreEntity pa
                   ON pa.userId = :userId
                   AND pa.key = CONCAT('author:', CAST(f.user.id AS string))
                   AND pa.updatedAt = (
                       SELECT MAX(pa2.updatedAt)
                       FROM UserPrefScoreEntity pa2
                       WHERE pa2.userId = :userId
                       AND pa2.key = pa.key
                   )
            LEFT JOIN UserPrefScoreEntity pg
                   ON pg.userId = :userId
                   AND pg.key = CONCAT('genre:', f.genre)
                   AND pg.updatedAt = (
                       SELECT MAX(pg2.updatedAt)
                       FROM UserPrefScoreEntity pg2
                       WHERE pg2.userId = :userId
                       AND pg2.key = pg.key
                   )
            LEFT JOIN UserPrefScoreEntity pe
                   ON pe.userId = :userId
                   AND pe.key = CONCAT('emotion:', f.emotion)
                   AND pe.updatedAt = (
                       SELECT MAX(pe2.updatedAt)
                       FROM UserPrefScoreEntity pe2
                       WHERE pe2.userId = :userId
                       AND pe2.key = pe.key
                   )
            WHERE f.isDeleted = false
              AND (:cursorCreatedAt IS NULL
                   OR f.createdAt < :cursorCreatedAt
                   OR (f.createdAt = :cursorCreatedAt AND f.id < :cursorId))
            GROUP BY f.id
            ORDER BY
                MAX(100.0 +
                    COALESCE(pa.score, 0) * 10.0 +
                    COALESCE(pg.score, 0) * 3.0 +
                    COALESCE(pe.score, 0) * 2.0) DESC,
                f.createdAt DESC,
                f.id DESC
            """)
    List<FeedEntity> findMyFeeds(
            @Param("userId") Long userId,
            @Param("cursorCreatedAt") LocalDateTime cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable);

    @Query("SELECT f FROM FeedEntity f WHERE f.isDeleted = false ORDER BY f.createdAt DESC")
    List<FeedEntity> findAllNotDeleted();

    @Query("""
            SELECT f
            FROM FeedEntity f
            LEFT JOIN f.user u
            LEFT JOIN FollowEntity fol
                   ON fol.following.id = f.user.id AND fol.follower.id = :userId
            LEFT JOIN UserPrefScoreEntity pa
                   ON pa.userId = :userId
                   AND pa.key = CONCAT('author:', CAST(f.user.id AS string))
                   AND pa.updatedAt = (
                       SELECT MAX(pa2.updatedAt)
                       FROM UserPrefScoreEntity pa2
                       WHERE pa2.userId = :userId
                       AND pa2.key = pa.key
                   )
            LEFT JOIN UserPrefScoreEntity pg
                   ON pg.userId = :userId
                   AND pg.key = CONCAT('genre:', f.genre)
                   AND pg.updatedAt = (
                       SELECT MAX(pg2.updatedAt)
                       FROM UserPrefScoreEntity pg2
                       WHERE pg2.userId = :userId
                       AND pg2.key = pg.key
                   )
            LEFT JOIN UserPrefScoreEntity pe
                   ON pe.userId = :userId
                   AND pe.key = CONCAT('emotion:', f.emotion)
                   AND pe.updatedAt = (
                       SELECT MAX(pe2.updatedAt)
                       FROM UserPrefScoreEntity pe2
                       WHERE pe2.userId = :userId
                       AND pe2.key = pe.key
                   )
            WHERE f.isDeleted = false
              AND (:cursorCreatedAt IS NULL
                   OR f.createdAt < :cursorCreatedAt
                   OR (f.createdAt = :cursorCreatedAt AND f.id < :cursorId))
            GROUP BY f.id
            ORDER BY
                MAX(CASE WHEN fol.id IS NOT NULL THEN 100.0 ELSE 0.0 END +
                    COALESCE(pa.score, 0) * 5.0 +
                    COALESCE(pg.score, 0) * 3.0 +
                    COALESCE(pe.score, 0) * 2.0) DESC,
                f.createdAt DESC,
                f.id DESC
            """)
    List<FeedEntity> findTimelineFeeds(
            @Param("userId") Long userId,
            @Param("cursorCreatedAt") LocalDateTime cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            Pageable pageable);

    @EntityGraph(attributePaths = "images") // images를 즉시 로딩
    @Query("""
              SELECT f
              FROM FeedEntity f
              WHERE f.isDeleted = false
                AND LOWER(f.content) LIKE LOWER(CONCAT('%', :keyword, '%'))
                AND (
                  :followingOnly = false OR EXISTS (
                    SELECT 1 FROM FollowEntity fol
                    WHERE fol.follower.id = :viewerId
                      AND fol.following.id = f.user.id
                  )
                )
              ORDER BY f.createdAt DESC, f.id DESC
            """)
    List<FeedEntity> findFeedByKeyword(
            @Param("keyword") String keyword,
            @Param("viewerId") Long viewerId,
            @Param("followingOnly") boolean followingOnly,
            Pageable pageable);

    Optional<FeedEntity> findById(Long id);
}
