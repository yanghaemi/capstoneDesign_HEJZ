package com.HEJZ.HEJZ_back.domain.dance.service;

import com.HEJZ.HEJZ_back.domain.dance.model.EmotionEnum;
import com.HEJZ.HEJZ_back.global.exception.CustomException;
import com.HEJZ.HEJZ_back.global.exception.ErrorCode;
import com.HEJZ.HEJZ_back.global.util.CsvLoader;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MotionRecommenderService {

    private final CsvLoader csvLoader;
    private final Random random = new Random();

    public List<String> recommendTopMotionsByEmotion(EmotionEnum targetEmotion, int count) {
        Map<String, List<EmotionEnum>> genreMap = csvLoader.getGenreEmotionMap();
        Map<String, List<EmotionEnum>> jointMap = csvLoader.getJointEmotionMap();

        Map<String, Double> scoreMap = new HashMap<>();

        for (String motionId : genreMap.keySet()) {
            double score = 0;
            List<EmotionEnum> genreEmotions = genreMap.getOrDefault(motionId, new ArrayList<>());
            List<EmotionEnum> jointEmotions = jointMap.getOrDefault(motionId, new ArrayList<>());

            for (EmotionEnum e : genreEmotions) {
                if (e == targetEmotion) score += 1.0;
            }
            for (EmotionEnum e : jointEmotions) {
                if (e == targetEmotion) score += 1.5;
            }

            if (score > 0) {
                scoreMap.put(motionId, score);
            }
        }

        List<Map.Entry<String, Double>> topEntries = scoreMap.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .collect(Collectors.toList());

        if (topEntries.isEmpty()) {
            throw new CustomException(ErrorCode.RECOMMENDATION_FAILED);
        }

        double maxScore = topEntries.get(0).getValue();
        List<String> topMotions = topEntries.stream()
                .filter(e -> e.getValue() == maxScore)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        Collections.shuffle(topMotions, random);
        return topMotions.stream().limit(count).collect(Collectors.toList());
    }

    public EmotionEnum determineDominantEmotion(List<EmotionEnum> genreEmotions, List<EmotionEnum> jointEmotions) {
        Map<EmotionEnum, Double> scoreMap = new HashMap<>();

        for (EmotionEnum e : genreEmotions) {
            scoreMap.put(e, scoreMap.getOrDefault(e, 0.0) + 1.0);
        }
        for (EmotionEnum e : jointEmotions) {
            scoreMap.put(e, scoreMap.getOrDefault(e, 0.0) + 1.5);
        }

        if (scoreMap.isEmpty()) {
            throw new CustomException(ErrorCode.RECOMMENDATION_FAILED);
        }

        double maxScore = Collections.max(scoreMap.values());
        List<EmotionEnum> topEmotions = scoreMap.entrySet().stream()
                .filter(e -> e.getValue() == maxScore)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        return topEmotions.get(random.nextInt(topEmotions.size()));
    }
}
