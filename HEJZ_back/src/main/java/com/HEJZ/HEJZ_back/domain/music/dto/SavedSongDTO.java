package com.HEJZ.HEJZ_back.domain.music.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SavedSongDTO {

    private String title;
    private String taskId;
    private String audioId;

    private String audioUrl;
    private String sourceAudioUrl;
    private String streamAudioUrl;
    private String sourceStreamAudioUrl;

    private String prompt;

    private String lyricsJson;
    private String plainLyrics;
}