package com.HEJZ.HEJZ_back.domain.community.follow.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import com.HEJZ.HEJZ_back.domain.community.follow.entity.FollowingEntity;

public interface FollowingRepository extends JpaRepository<FollowingEntity, Long> {

    public List<FollowingEntity> findFollowingByUsername(String username);

    @Modifying
    @Query("DELETE FROM FollowingEntity f WHERE f.username = :username AND f.following = :following")
    public void deleteByUsernameAndFollowing(String username, String following);
}
