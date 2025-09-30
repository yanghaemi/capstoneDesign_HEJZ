package com.HEJZ.HEJZ_back.domain.community.feed.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "feed_media")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class FeedMedia {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "feed_id", nullable = false)
    private Feed feed;

    @Column(nullable = false, length = 512)
    private String url;

    private int ord;
}
