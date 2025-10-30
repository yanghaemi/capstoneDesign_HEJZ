package com.HEJZ.HEJZ_back.domain.community.user.entity;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.HEJZ.HEJZ_back.domain.community.feed.entity.CommentEntity;
import com.HEJZ.HEJZ_back.domain.community.feed.entity.FeedEntity;
import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@EntityListeners(AuditingEntityListener.class)
@Builder
@Table(name = "users")
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String username;

    @Column(nullable = false, length = 255)
    private String passwordHash; // 비번을 bcrypt 해싱하여 저장

    @Column(nullable = false, length = 100)
    private String email;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(nullable = false, length = 255)
    private String profileImageUrl;

    @Column(length = 500)
    private String bio;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "user") // feedEntity의 user 필드에 매핑
    @JsonBackReference
    private List<FeedEntity> myfeeds;

    @OneToMany(mappedBy = "user") // commentEntity의 user 필드에 매핑
    @JsonBackReference
    private List<CommentEntity> myComments;
}
