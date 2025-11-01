package com.HEJZ.HEJZ_back.domain.music.dto;

import lombok.Getter;
import lombok.Setter;

// Get Timestamped Lyric DTO
@Getter
@Setter
public class SunoLyricsDTO {
    String taskId;
    String audioId;
    int musicIndex; // possible valudes: 0, 1
}
