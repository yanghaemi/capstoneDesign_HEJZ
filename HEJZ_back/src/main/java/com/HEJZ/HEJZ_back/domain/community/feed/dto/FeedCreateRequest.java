package com.HEJZ.HEJZ_back.domain.community.feed.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record FeedCreateRequest(
        @NotBlank(message = "내용은 필수입니다") @Size(max = 255, message = "피드는 255자 이하로 작성해주세요") String content,

        Long songId,

        String emotion,
        String genre,

        List<String> imageUrls,

        List<MediaUrlRequest> media) {
}
