package com.HEJZ.HEJZ_back.domain.community.feed.repository;

import com.HEJZ.HEJZ_back.domain.community.feed.entity.FeedEntity;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FeedRepository extends JpaRepository<FeedEntity, Long> {

  @Query("""
      SELECT f FROM FeedEntity f
      WHERE f.user.id = :userId
        AND f.isDeleted = false
        AND (
             :cursorCreatedAt IS NULL
             OR (f.createdAt < :cursorCreatedAt)
             OR (f.createdAt = :cursorCreatedAt AND f.id < :cursorId)
        )
      ORDER BY f.createdAt DESC, f.id DESC
      """)
  List<FeedEntity> findMyFeeds(
      @Param("userId") Long userId,
      @Param("cursorCreatedAt") LocalDateTime cursorCreatedAt,
      @Param("cursorId") Long cursorId,
      Pageable pageable);

  @Query("""
      SELECT f FROM FeedEntity f
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
