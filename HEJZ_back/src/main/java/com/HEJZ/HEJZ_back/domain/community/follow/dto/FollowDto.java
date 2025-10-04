package com.HEJZ.HEJZ_back.domain.community.follow.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class FollowDto {
    private String username;
    private String nickname;
    private String profileImageUrl;
}
