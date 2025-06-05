package com.HEJZ.HEJZ_back.dto;


import lombok.Getter;
import lombok.Setter;

// Get Timestamped Lyric DTO
@Getter
@Setter
public class LyricsDTO {
    String taskId;
    String AudioId;
    int musicIndex; // possible valudes: 0, 1
}
