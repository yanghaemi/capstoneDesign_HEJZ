package com.HEJZ.HEJZ_back.domain.dance.service;

import com.HEJZ.HEJZ_back.domain.dance.model.FinalSelectedMotion;
import com.HEJZ.HEJZ_back.domain.dance.repository.FinalSelectedMotionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FinalSelectionService {
    private final FinalSelectedMotionRepository repository;

    public void save(List<String> motionIds) {
        List<FinalSelectedMotion> list = motionIds.stream()
                .map(FinalSelectedMotion::new)
                .toList();
        repository.saveAll(list);
    }
}
