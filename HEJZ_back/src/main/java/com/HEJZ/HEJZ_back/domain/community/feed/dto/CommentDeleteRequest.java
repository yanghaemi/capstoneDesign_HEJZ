package com.HEJZ.HEJZ_back.domain.community.feed.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CommentDeleteRequest {
    private Long commentId;
}
