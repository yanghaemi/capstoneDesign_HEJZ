package com.HEJZ.HEJZ_back.domain.community.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.HEJZ.HEJZ_back.domain.community.user.entity.UserEntity;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {

    public UserEntity findByUsername(String username);

    // @Modifying(clearAutomatically = true, flushAutomatically = true)
    // @Query("UPDATE UserEntity u SET u.follower = u.follower + 1 WHERE u.username
    // = :username")
    // public int plusFollower(@Param("username") String username); // 팔로워 수 1 증가

    // @Modifying(clearAutomatically = true, flushAutomatically = true)
    // @Query("UPDATE UserEntity u SET u.follower = CASE WHEN u.follower > 0 THEN
    // u.follower - 1 ELSE 0 END where u.username = :username")
    // public int minusFollower(@Param("username") String username); // 팔로워 수 1 감소

    // @Modifying(clearAutomatically = true, flushAutomatically = true)
    // @Query("UPDATE UserEntity u SET u.following = u.following + 1 WHERE
    // u.username = :username")
    // public int plusFollowing(@Param("username") String username); // 팔로잉 수 1 증가

    // @Modifying(clearAutomatically = true, flushAutomatically = true)
    // @Query("UPDATE UserEntity u SET u.following = CASE WHEN u.following > 0 THEN
    // u.following - 1 ELSE 0 END WHERE u.username = :username")
    // public int minusFollowing(@Param("username") String username); // 팔로잉 수 1 감소
}
