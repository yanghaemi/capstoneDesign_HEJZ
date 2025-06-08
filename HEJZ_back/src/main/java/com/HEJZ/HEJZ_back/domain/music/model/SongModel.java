package com.HEJZ.HEJZ_back.domain.music.model;
// Song 정보 저장 테이블 생성


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SongModel {
    @Id // primary key
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 프로젝트에 연결된 DB의 넘버링 전략을 따라감
    private int id;

    @Column(nullable = false, unique = true)
    private String taskId; // taskId

    @Column(nullable = false)
    private String title; // 곡 노래

    @Column(nullable = false)
    private String lyrics; //가사

    @Column(nullable = true)
    private String songUrl; // 노래 url

    @Column(nullable = true)
    private String songPath; // 노래 경로
    
    @Column(nullable = false)
    private String prompt; // 프롬포트
}
