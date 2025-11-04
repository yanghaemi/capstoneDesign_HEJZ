package com.HEJZ.HEJZ_back.domain.community.recommendation.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "user_pref_score", uniqueConstraints = @UniqueConstraint(name = "uk_user_key", columnNames = { "user_id",
                "pref_key" }), indexes = {
                                @Index(name = "idx_user", columnList = "user_id"),
                                @Index(name = "idx_user_score", columnList = "user_id, score DESC")
                })
@EntityListeners(AuditingEntityListener.class)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPrefScoreEntity {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Column(name = "user_id", nullable = false)
        private Long userId;

        @Column(name = "pref_key", nullable = false, length = 100)
        private String key; // e.g. "emotion:행복", "genre:ROCK"

        @Column(nullable = false)
        private double score; // 누적 가중치

        @Version
        private long version; // 낙관적 lock

        @CreatedDate
        @Column(nullable = false, updatable = false)
        private LocalDateTime createdAt;

        @LastModifiedDate
        @Column(nullable = false)
        private LocalDateTime updatedAt;
}
