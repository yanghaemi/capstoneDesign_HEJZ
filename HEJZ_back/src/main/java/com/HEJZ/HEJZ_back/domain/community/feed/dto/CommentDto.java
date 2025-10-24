package com.HEJZ.HEJZ_back.domain.community.feed.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.HEJZ.HEJZ_back.domain.community.feed.entity.FeedEntity;
import com.HEJZ.HEJZ_back.domain.community.user.entity.UserEntity;
import com.HEJZ.HEJZ_back.domain.community.feed.entity.CommentLikeEntity;

public record CommentDto (
    Long id,
    String comment,
    FeedEntity feed,
    List<CommentLikeEntity> commentLike,
    LocalDateTime createdAt
){}
