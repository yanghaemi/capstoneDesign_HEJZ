package com.HEJZ.HEJZ_back.domain.dance.dto;

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
public class LyricsRequest {
    @Schema(description = "전체 가사 (줄바꿈 포함) - 3, 4번 가사 분석 기반 추천에 사용")
    private String lyrics;

    @Schema(description = "노래 생성 시 사용자가 선택한 감정 (예: '행복') - 1번 추천에 사용")
    private String selectedEmotion;

    @Schema(description = "안무 생성 전 선택한 장르 이름 (예: 'Breakdance') - 2번 추천에 사용")
    private String selectedGenre;
}