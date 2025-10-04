package com.HEJZ.HEJZ_back.domain.community.follow.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import com.HEJZ.HEJZ_back.domain.community.follow.entity.FollowEntity;

import jakarta.transaction.Transactional;

@Repository
public interface FollowRepository extends JpaRepository<FollowEntity, Long> {

    // 이미 팔로우 했는지 확인
    boolean existsByFollower_UsernameAndFollowing_Username(String followerUsername, String followingUsername);

    // 언팔로우
    @Modifying
    @Transactional
    int deleteByFollowerUsernameAndFollowingUsername(String followerUsername, String followingUsername);

    long countByFollowingUsername(String username); // 그 사람의 팔로워 수

    long countByFollowerUsername(String username); // 그 사람의 팔로잉 수

    // 목록
    List<FollowEntity> findByFollowerUsername(String username); // 내가 팔로우하는 사람들

    List<FollowEntity> findByFollowingUsername(String username); // 나를 팔로우하는 사람들
}
