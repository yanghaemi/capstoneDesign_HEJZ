package com.HEJZ.HEJZ_back.domain.community.feed.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class LikeDto {
    private Long id;
    private TargetType target;
    private Long targetId;
    private String username;
    private LocalDateTime createdAt;
    private boolean liked; // true: 좋아요됨, false: 취소됨

    public static LikeDto liked(Long id, TargetType t, Long targetId, String u, LocalDateTime at) {
        return LikeDto.builder().id(id).target(t).targetId(targetId).username(u).createdAt(at).liked(true).build();
    }

    public static LikeDto unliked(TargetType t, Long targetId, String u) {
        return LikeDto.builder().id(null).target(t).targetId(targetId).username(u).liked(false).build();
    }
}
