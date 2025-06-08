package com.HEJZ.HEJZ_back.domain.music.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedSong {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String taskId;
    private String audioId;

    private String audioUrl;              // mp3 저장 경로 (예: /music/파일명)
    private String sourceAudioUrl;        // 원본 mp3 URL
    private String streamAudioUrl;        // 스트리밍 URL
    private String sourceStreamAudioUrl;  // 원본 스트리밍 URL

    @Column(columnDefinition = "TEXT")
    private String prompt;                // 생성에 사용된 프롬프트

    @Column(columnDefinition = "TEXT")
    private String lyricsJson;

    @Column(columnDefinition = "TEXT")
    private String plainLyrics;


    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

