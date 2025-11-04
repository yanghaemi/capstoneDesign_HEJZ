package com.HEJZ.HEJZ_back.domain.community.feed.entity;

import com.HEJZ.HEJZ_back.domain.community.user.entity.UserEntity;
import com.HEJZ.HEJZ_back.domain.music.entity.SavedSong;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "feeds", indexes = {
        @Index(name = "idx_user_deleted_created_id", columnList = "user_id, is_deleted, created_at DESC, id DESC")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) // 작성자
    @JoinColumn(name = "user_id", nullable = false)
    @JsonBackReference
    private UserEntity user;

    @Column(nullable = false, length = 255)
    private String content;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder.Default
    @Column(nullable = false)
    private boolean isDeleted = false;

    @Builder.Default
    @OneToMany(mappedBy = "feed", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<FeedMediaEntity> images = new ArrayList<>();

    @OneToMany(mappedBy = "feed")
    @JsonManagedReference
    private List<FeedLikeEntity> feedLikes;

    @OneToMany(mappedBy = "feed")
    @JsonManagedReference
    private List<CommentEntity> comments;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private SavedSong song;

    @Column(name = "emotion")
    private String emotion;

    @Column(name = "genre")
    private String genre;
}
