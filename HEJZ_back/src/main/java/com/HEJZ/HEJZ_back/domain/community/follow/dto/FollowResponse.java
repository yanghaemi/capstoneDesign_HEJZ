package com.HEJZ.HEJZ_back.domain.community.follow.dto;

import com.HEJZ.HEJZ_back.domain.community.follow.entity.FollowerEntity;
import com.HEJZ.HEJZ_back.domain.community.follow.entity.FollowingEntity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FollowResponse {
    private FollowerEntity followerEntity;
    private FollowingEntity followingEntity;
}
