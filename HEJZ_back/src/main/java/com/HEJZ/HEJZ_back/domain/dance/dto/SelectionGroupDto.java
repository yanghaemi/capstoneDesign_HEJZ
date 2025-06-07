package com.HEJZ.HEJZ_back.domain.dance.dto;

import lombok.Getter;
import lombok.Setter;
import io.swagger.v3.oas.annotations.media.Schema;


import java.util.List;

@Getter
@Setter
public class SelectionGroupDto {
    @Schema(description = "가사 그룹 (2줄 또는 마지막 줄)")
    private String lyricsGroup;

    @Schema(description = "선택된 안무 motionId 목록")
    private List<String> selectedMotionIds;
}

