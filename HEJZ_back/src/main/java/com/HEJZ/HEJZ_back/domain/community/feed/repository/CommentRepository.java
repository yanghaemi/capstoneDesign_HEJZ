package com.HEJZ.HEJZ_back.domain.community.feed.repository;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.HEJZ.HEJZ_back.domain.community.feed.entity.CommentEntity;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<CommentEntity, Long> {

    @Query("""
            SELECT c From CommentEntity c
            WHERE c.user.username = :username
            ORDER BY c.createdAt DESC
            """)
    List<CommentEntity> findComment_ByUsername(@Param("username") String username);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("delete from CommentEntity c where c.id = :id")
    int deleteByCommentId(@Param("id") Long id);
}
