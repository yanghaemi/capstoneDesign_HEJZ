package com.HEJZ.HEJZ_back.domain.dance.service;

import com.HEJZ.HEJZ_back.domain.dance.model.EmotionResult;
import com.HEJZ.HEJZ_back.domain.dance.repository.EmotionResultRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmotionResultService {
    private final EmotionResultRepository repository;

    public EmotionResultService(EmotionResultRepository repository) {
        this.repository = repository;
    }

    @Async
    public void save(EmotionResult result) {
        repository.save(result);
    }
}
