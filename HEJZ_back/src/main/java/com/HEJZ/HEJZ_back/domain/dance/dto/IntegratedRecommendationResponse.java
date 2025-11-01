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

    @Schema(description = "가사 덩어리별 통합 추천 결과 목록 (각 덩어리당 4개 안무)")
    private List<LyricsGroupRecommendation> lyricsRecommendations;
}