package com.HEJZ.HEJZ_back.domain.dance.dto;

import com.HEJZ.HEJZ_back.domain.dance.model.EmotionEnum;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResult {

    @Schema(description = "두 줄로 끊긴 가사 조각")
    private String lyrics;

    @Schema(description = "예측된 감정")
    private EmotionEnum emotion;

    @Schema(description = "추천된 안무 motionId 목록 (최대 4개)")
    private List<String> motionIds;
}
