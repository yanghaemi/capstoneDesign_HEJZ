package com.HEJZ.HEJZ_back.domain.dance.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class IntegratedRecommendationResponse {

    @Schema(description = "1. 선택 감정 기반 추천 결과 (하나의 그룹)")
    private RecommendationResult selectedEmotionResult;

    @Schema(description = "2. 장르 기반 추천 결과 (하나의 그룹)")
    private RecommendationResult genreResult;

    @Schema(description = "3, 4. 가사 분석 기반 추천 결과 목록 (가사 덩어리별)")
    private List<RecommendationResult> lyricsAnalysisResults;
}