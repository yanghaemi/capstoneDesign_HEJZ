package com.HEJZ.HEJZ_back.domain.community.follow.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.HEJZ.HEJZ_back.domain.community.follow.entity.FollowerEntity;

public interface FollowerRepository extends JpaRepository<FollowerEntity, Long> {
    public List<FollowerEntity> findFollowerByUsername(String username);

    public void deleteByUsernameAndFollowed(String username, String followed);
}
