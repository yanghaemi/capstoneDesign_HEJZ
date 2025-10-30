package com.HEJZ.HEJZ_back.domain.community.feed.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import com.HEJZ.HEJZ_back.domain.community.feed.entity.CommentLikeEntity;

import jakarta.transaction.Transactional;

public interface CommentLikeRepository extends JpaRepository<CommentLikeEntity, Long> {

    boolean existsByCommentIdAndUserId(Long commentId, Long userId);

    long countByComment_Id(Long commentId);

    @Modifying
    @Transactional
    void deleteByCommentIdAndUserId(Long commentId, Long userId);
}
