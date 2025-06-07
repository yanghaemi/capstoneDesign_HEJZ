package com.HEJZ.HEJZ_back.domain.dance.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import io.swagger.v3.oas.annotations.media.Schema;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LyricsRequest {
    @Schema(description = "전체 가사 (줄바꿈 포함)")
    private String lyrics;
}

