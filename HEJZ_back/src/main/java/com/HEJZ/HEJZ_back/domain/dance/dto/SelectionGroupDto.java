package com.HEJZ.HEJZ_back.domain.dance.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SelectionGroupDto {
    private String lyricsGroup;
    private List<String> selectedMotionIds;
}

