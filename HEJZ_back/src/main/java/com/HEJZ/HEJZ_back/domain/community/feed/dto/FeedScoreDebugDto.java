package com.HEJZ.HEJZ_back.domain.community.feed.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class FeedScoreDebugDto {
    private Long feedId;
    private String content;
    private Long authorId;
    private String authorName;
    private String genre;
    private String emotion;
    private LocalDateTime createdAt;
    private Long ageSeconds; // 생성 후 경과 시간

    // 점수 상세 정보
    private Double totalScore;
    private ScoreBreakdown breakdown;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class ScoreBreakdown {
        // 선호도 점수 (W_PREF = 0.7)
        private Double prefScore; // 선호도 총점
        private Double prefWeightedScore; // 선호도 가중 점수 (prefScore * 0.7)

        private Double authorScore; // 작성자 원본 점수
        private Double authorWeighted; // 작성자 가중 (score * 1.0)

        private Double genreScore; // 장르 원본 점수
        private Double genreWeighted; // 장르 가중 (score * 0.7)

        private Double emotionScore; // 감정 원본 점수
        private Double emotionWeighted; // 감정 가중 (score * 0.4)

        // 최신성 점수 (W_RECENCY = 0.3)
        private Double recencyScore; // 최신성 원본 점수
        private Double recencyWeightedScore; // 최신성 가중 점수 (recencyScore * 0.3)
    }
}
