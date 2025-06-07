package com.HEJZ.HEJZ_back.dto;


import lombok.Getter;
import lombok.Setter;

// Get Timestamped Lyric DTO
@Getter
@Setter
public class SunoLyricsDTO {
    String taskId;
    String AudioId;
    int musicIndex; // possible valudes: 0, 1
}
