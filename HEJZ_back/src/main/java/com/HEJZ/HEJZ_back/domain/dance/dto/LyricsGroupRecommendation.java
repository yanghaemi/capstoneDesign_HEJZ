package com.HEJZ.HEJZ_back.domain.dance.dto;

import com.HEJZ.HEJZ_back.domain.dance.model.EmotionEnum;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import io.swagger.v3.oas.annotations.media.Schema;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LyricsGroupRecommendation {

    @Schema(description = "가사 덩어리 (2줄 또는 마지막 줄)")
    private String lyrics;

    @Schema(description = "AI가 분석한 이 가사의 감정")
    private EmotionEnum analyzedEmotion;

    @Schema(description = "로직 1: 선택 감정 기반 추천 안무 ID")
    private String selectedEmotionMotion;

    @Schema(description = "로직 2: 선택 장르 기반 추천 안무 ID")
    private String selectedGenreMotion;

    @Schema(description = "로직 3: 가사 분석 감정 기반 추천 안무 ID (1순위)")
    private String analyzedMotion1;

    @Schema(description = "로직 4: 가사 분석 감정 기반 추천 안무 ID (2순위)")
    private String analyzedMotion2;
}