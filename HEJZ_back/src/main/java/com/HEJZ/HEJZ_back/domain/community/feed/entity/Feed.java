package com.HEJZ.HEJZ_back.domain.community.feed.entity;

import com.HEJZ.HEJZ_back.domain.community.user.entity.UserEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "feed", indexes = {
        @Index(name = "idx_user_deleted_created_id",
                columnList = "user_id, is_deleted, created_at DESC, id DESC")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Feed {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) // 작성자
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(nullable = false, length = 255)
    private String content;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private boolean isDeleted = false;

    @OneToMany(mappedBy = "feed", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FeedMedia> images = new ArrayList<>();
}
