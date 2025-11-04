package com.HEJZ.HEJZ_back.domain.community.recommendation.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.HEJZ.HEJZ_back.domain.community.recommendation.entity.UserPrefScoreEntity;

public interface UserPrefScoreRepository extends JpaRepository<UserPrefScoreEntity, Long> {
        Optional<UserPrefScoreEntity> findByUserIdAndKey(Long userId, String key);

        List<UserPrefScoreEntity> findTop20ByUserIdOrderByScoreDesc(Long userId);

        boolean existsByUserIdAndKey(Long userId, String key);

        // 취향 점수 조회
        @Query("select u from UserPrefScoreEntity u " +
                        "where u.userId = :userId and u.key in :keys")
        List<UserPrefScoreEntity> findAllByUserIdAndKeyIn(
                        @Param("userId") Long userId,
                        @Param("keys") Collection<String> keys);
}
