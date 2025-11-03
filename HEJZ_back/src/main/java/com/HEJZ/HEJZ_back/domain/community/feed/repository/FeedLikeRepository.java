package com.HEJZ.HEJZ_back.domain.community.feed.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import com.HEJZ.HEJZ_back.domain.community.feed.entity.FeedLikeEntity;

import jakarta.transaction.Transactional;

public interface FeedLikeRepository extends JpaRepository<FeedLikeEntity, Long> {
    boolean existsByFeedIdAndUserId(Long feedId, Long userId);

    @Modifying
    @Transactional
    void deleteByFeedIdAndUserId(Long feedId, Long userId);

    List<FeedLikeEntity> findByFeedId(Long feedId);

    List<FeedLikeEntity> findByUserId(Long userId);
}
