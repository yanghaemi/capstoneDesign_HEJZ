package com.HEJZ.HEJZ_back.domain.music.dto;


import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SongSaveLyricsDTO {
    int id;
    String taskId;
    String title;
    String lyrics;
    String songUrl;
    String songPath;
    String prompt;
}
