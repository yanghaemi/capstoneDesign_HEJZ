package com.HEJZ.HEJZ_back.domain.music.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;

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

    @Column(name = "task_id")
    private String taskId;

    @Column(name = "audio_id")
    private String audioId;

    @Column(name = "audio_url")
    private String audioUrl; // mp3 저장 경로 (예: /music/파일명)

    @Column(name = "source_audio_url")
    private String sourceAudioUrl; // 원본 mp3 URL

    @Column(name = "stream_audio_url")
    private String streamAudioUrl; // 스트리밍 URL

    @Column(name = "source_stream_audio_url")
    private String sourceStreamAudioUrl; // 원본 스트리밍 URL

    @Column(name = "prompt", columnDefinition = "TEXT")
    private String prompt;

    @Column(name = "lyrics_json", columnDefinition = "TEXT")
    private String lyricsJson;

    @Column(name = "plain_lyrics", columnDefinition = "TEXT")
    private String plainLyrics;

    @CreatedDate
    private LocalDateTime createdAt;
}
