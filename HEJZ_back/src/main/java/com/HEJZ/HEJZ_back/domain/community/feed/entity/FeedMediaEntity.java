package com.HEJZ.HEJZ_back.domain.community.feed.entity;

import com.HEJZ.HEJZ_back.domain.community.feed.dto.MediaType;
import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "feed_media")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedMediaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feed_id", nullable = false)
    @JsonBackReference
    private FeedEntity feed;

    @Column(nullable = false, length = 512)
    private String url;
    private int ord;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MediaType type = MediaType.IMAGE;

    @Column(name = "thumbnail_url", length = 512)
    private String thumbnailUrl;

    @Column(name = "duration_ms")
    private Integer durationMs;

    @Column(name = "mime_type", length = 100)
    private String mimeType;
}