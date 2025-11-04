package com.HEJZ.HEJZ_back.domain.music.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.HEJZ.HEJZ_back.domain.community.user.entity.UserEntity;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@EntityListeners(AuditingEntityListener.class)
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
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "waveform_json", columnDefinition = "LONGTEXT")
    private String waveformJson;

    @Column(name = "hoot_cer")
    private Double hootCer;

    @Column(name = "is_streamed")
    private Boolean isStreamed;

    @Version
    private long version; // 낙관적 락 버전

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user")
    @JsonBackReference
    private UserEntity user;

}
