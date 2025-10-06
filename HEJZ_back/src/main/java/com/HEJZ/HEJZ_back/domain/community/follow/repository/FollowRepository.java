package com.HEJZ.HEJZ_back.domain.community.follow.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import com.HEJZ.HEJZ_back.domain.community.follow.entity.FollowEntity;

import jakarta.transaction.Transactional;

@Repository
public interface FollowRepository extends JpaRepository<FollowEntity, Long> {

    // 팔로우 관계 존재 여부: follower(나) -> following(상대)
    boolean existsByFollower_UsernameAndFollowing_Username(String followerUsername, String followingUsername);

    // 언팔로우: follower(나) -> following(상대)
    @Modifying @Transactional
    int deleteByFollower_UsernameAndFollowing_Username(String followerUsername, String followingUsername);

    // 카운트
    long countByFollowing_Username(String username); // 그 사람의 팔로워 수
    long countByFollower_Username(String username);  // 그 사람의 팔로잉 수

    // 목록
    List<FollowEntity> findByFollower_Username(String username);   // 내가 팔로우하는 사람들(= followings)
    List<FollowEntity> findByFollowing_Username(String username);  // 나를 팔로우하는 사람들(= followers)
}
