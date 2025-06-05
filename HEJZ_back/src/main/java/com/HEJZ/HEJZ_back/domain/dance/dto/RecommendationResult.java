package com.HEJZ.HEJZ_back.domain.dance.dto;

import com.HEJZ.HEJZ_back.domain.dance.model.EmotionEnum;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResult {
    private String lyrics;
    private EmotionEnum emotion;
    private List<String> motionIds;
}
