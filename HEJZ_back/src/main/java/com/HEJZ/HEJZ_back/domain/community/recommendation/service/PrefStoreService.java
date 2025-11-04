package com.HEJZ.HEJZ_back.domain.community.recommendation.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import com.HEJZ.HEJZ_back.domain.community.recommendation.entity.UserPrefScoreEntity;
import com.HEJZ.HEJZ_back.domain.community.recommendation.repository.UserPrefScoreRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PrefStoreService {
    private final UserPrefScoreRepository repo;

    @Transactional
    public void add(Long userId, String key, double delta) {
        try {
            var e = repo.findByUserIdAndKey(userId, key)
                    .orElseGet(() -> repo.save(UserPrefScoreEntity.builder()
                            .userId(userId).key(key).score(0.0).build()));
            e.setScore(e.getScore() + delta);
            // JPA flush 시 유니크 충돌나면 캐치해서 재시도
        } catch (DataIntegrityViolationException ex) {
            // 경쟁 생성 레이스 → 다시 읽고 가산
            var e = repo.findByUserIdAndKey(userId, key).orElseThrow();
            e.setScore(e.getScore() + delta);
        }
    }

    /** 현재 점수 가져오기(없으면 0) */
    @Transactional
    public double get(Long userId, String key) {
        return repo.findByUserIdAndKey(userId, key).map(UserPrefScoreEntity::getScore).orElse(0.0);
    }

    /** 상위 K 키워드 */
    @Transactional
    public java.util.List<UserPrefScoreEntity> topK(Long userId, int k) {
        var list = repo.findTop20ByUserIdOrderByScoreDesc(userId);
        return list.size() <= k ? list : list.subList(0, k);
    }
}
