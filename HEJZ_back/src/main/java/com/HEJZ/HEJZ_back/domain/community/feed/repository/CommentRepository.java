package com.HEJZ.HEJZ_back.domain.community.feed.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.HEJZ.HEJZ_back.domain.community.feed.entity.CommentEntity;

@Repository
public interface CommentRepository extends JpaRepository<CommentEntity, Long> {
    void deleteComment(Long commentId);
}
