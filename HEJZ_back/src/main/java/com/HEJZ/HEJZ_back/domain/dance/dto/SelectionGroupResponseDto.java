package com.HEJZ.HEJZ_back.domain.dance.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import io.swagger.v3.oas.annotations.media.Schema;


import java.util.List;

@Getter
@AllArgsConstructor
public class SelectionGroupResponseDto {
    @Schema(description = "가사 그룹 (2줄 또는 마지막 줄)")
    private String lyricsGroup;

    @Schema(description = "선택된 안무 영상 정보 목록")
    private List<MotionVideoDto> selectedMotionIds;
}