package com.HEJZ.HEJZ_back.domain.music.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
//@Table(name = "song_model") // DB에 실제 테이블 이름
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Song {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String taskId;
    private String title;

    @Column(columnDefinition = "TEXT")
    private String lyrics;

    private String songUrl;
    private String songPath;
    private String prompt;
}
