package com.HEJZ.HEJZ_back.domain.dance.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmotionResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String lyrics; // 분석한 2줄 가사

    @Enumerated(EnumType.STRING)
    private EmotionEnum emotion; // 감정

    @ElementCollection(fetch = FetchType.EAGER)
    private List<String> motionIds; // 추천된 안무ID 리스트 (4개)
}
