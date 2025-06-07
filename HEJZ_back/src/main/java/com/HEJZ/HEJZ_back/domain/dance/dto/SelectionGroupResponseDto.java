package com.HEJZ.HEJZ_back.domain.dance.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class SelectionGroupResponseDto {
    private String lyricsGroup;
    private List<MotionVideoDto> selectedMotionIds;
}