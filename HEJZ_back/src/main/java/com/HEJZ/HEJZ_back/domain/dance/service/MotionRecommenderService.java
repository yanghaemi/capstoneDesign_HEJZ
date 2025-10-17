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

    // 장르-감정 매핑 테이블 (2번 추천 로직에 사용)
    public static final Map<String, List<String>> GENRE_EMOTION_MAPPING = Map.ofEntries(
            Map.entry("Breakdance", List.of("열정", "도전", "자신감")),
            Map.entry("Pop", List.of("차분함", "열정", "혐오")),
            Map.entry("Lock", List.of("행복", "자신감", "매혹")),
            Map.entry("Waack", List.of("사랑", "자신감", "매혹")),
            Map.entry("House", List.of("행복", "열정", "놀람")),
            Map.entry("Krump", List.of("분노", "열정", "공포")),
            Map.entry("Jazz", List.of("열정", "사랑", "매혹")),
            Map.entry("LA_Hiphop", List.of("자신감", "열정", "차분함")),
            Map.entry("Middle_Hiphop", List.of("분노", "자신감", "공포")),
            Map.entry("Ballet_Jazz", List.of("희망", "사랑", "슬픔"))
    );

    public static Map<String, List<String>> getGenreEmotionMapping() {
        return GENRE_EMOTION_MAPPING;
    }

    /**
     * 1번, 3번, 4번 로직: 특정 감정에 해당하는 안무를 추천합니다. (기존 로직 유지)
     */
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
            Set<String> allMotions = new HashSet<>(genreMap.keySet());
            if (allMotions.isEmpty()) {
                throw new CustomException(ErrorCode.RECOMMENDATION_FAILED);
            }
            List<String> randomMotions = new ArrayList<>(allMotions);
            Collections.shuffle(randomMotions, random);
            return randomMotions.stream().limit(count).collect(Collectors.toList());
        }

        double maxScore = topEntries.get(0).getValue();
        List<String> topMotions = topEntries.stream()
                .filter(e -> e.getValue() == maxScore)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        Collections.shuffle(topMotions, random);
        return topMotions.stream().limit(count).collect(Collectors.toList());
    }

    /**
     * 2. 안무 장르를 기반으로 대표 감정 3가지에 대해 점수를 합산하여 안무를 추천합니다. (신규 로직)
     */
    public List<String> recommendTopMotionsByGenre(String genreName, int count) {
        String standardizedGenreName = genreName.trim();

        List<String> emotionNames = GENRE_EMOTION_MAPPING.getOrDefault(standardizedGenreName, Collections.emptyList());

        if (emotionNames.isEmpty()) {
            return Collections.emptyList();
        }

        List<EmotionEnum> targetEmotions = emotionNames.stream()
                .map(EmotionEnum::fromString)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (targetEmotions.isEmpty()) {
            throw new CustomException(ErrorCode.RECOMMENDATION_FAILED);
        }

        Map<String, List<EmotionEnum>> genreMap = csvLoader.getGenreEmotionMap();
        Map<String, List<EmotionEnum>> jointMap = csvLoader.getJointEmotionMap();

        Map<String, Double> scoreMap = new HashMap<>();

        // 3. 3가지 목표 감정 각각에 대해 점수를 계산합니다.
        for (String motionId : genreMap.keySet()) {
            double totalScore = 0;
            List<EmotionEnum> motionGenreEmotions = genreMap.getOrDefault(motionId, Collections.emptyList());
            List<EmotionEnum> motionJointEmotions = jointMap.getOrDefault(motionId, Collections.emptyList());

            for (EmotionEnum targetEmotion : targetEmotions) {
                // 장르 점수 +1.0
                if (motionGenreEmotions.contains(targetEmotion)) {
                    totalScore += 1.0;
                }
                // 관절 점수 +1.5
                if (motionJointEmotions.contains(targetEmotion)) {
                    totalScore += 1.5;
                }
            }

            if (totalScore > 0) {
                scoreMap.put(motionId, totalScore);
            }
        }

        // 4. 점수가 가장 높은 모션을 무작위로 선택합니다.
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

    /**
     * 특정 감정에 해당하는 안무를 추천하되, 제외 목록을 고려합니다.
     */
    public List<String> recommendTopMotionsByEmotionExcluding(
            EmotionEnum targetEmotion,
            int count,
            Set<String> excludeIds) {

        Map<String, List<EmotionEnum>> genreMap = csvLoader.getGenreEmotionMap();
        Map<String, List<EmotionEnum>> jointMap = csvLoader.getJointEmotionMap();

        Map<String, Double> scoreMap = new HashMap<>();

        for (String motionId : genreMap.keySet()) {
            // 제외 목록에 있으면 스킵
            if (excludeIds.contains(motionId)) {
                continue;
            }

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
            Set<String> allMotions = new HashSet<>(genreMap.keySet());
            allMotions.removeAll(excludeIds); // 제외 목록 제거

            if (allMotions.isEmpty()) {
                throw new CustomException(ErrorCode.RECOMMENDATION_FAILED);
            }

            List<String> randomMotions = new ArrayList<>(allMotions);
            Collections.shuffle(randomMotions, random);
            return randomMotions.stream().limit(count).collect(Collectors.toList());
        }

        double maxScore = topEntries.get(0).getValue();
        List<String> topMotions = topEntries.stream()
                .filter(e -> e.getValue() == maxScore)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        Collections.shuffle(topMotions, random);
        return topMotions.stream().limit(count).collect(Collectors.toList());
    }

    /**
     * 장르 기반 추천
     */
    public List<String> recommendTopMotionsByGenreExcluding(
            String genreName,
            int count,
            Set<String> excludeIds) {

        String standardizedGenreName = genreName.trim();
        List<String> emotionNames = GENRE_EMOTION_MAPPING.getOrDefault(standardizedGenreName, Collections.emptyList());

        if (emotionNames.isEmpty()) {
            return Collections.emptyList();
        }

        List<EmotionEnum> targetEmotions = emotionNames.stream()
                .map(EmotionEnum::fromString)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (targetEmotions.isEmpty()) {
            throw new CustomException(ErrorCode.RECOMMENDATION_FAILED);
        }

        Map<String, List<EmotionEnum>> genreMap = csvLoader.getGenreEmotionMap();
        Map<String, List<EmotionEnum>> jointMap = csvLoader.getJointEmotionMap();
        Map<String, Double> scoreMap = new HashMap<>();

        for (String motionId : genreMap.keySet()) {
            // 제외 목록에 있으면 스킵
            if (excludeIds.contains(motionId)) {
                continue;
            }

            double totalScore = 0;
            List<EmotionEnum> motionGenreEmotions = genreMap.getOrDefault(motionId, Collections.emptyList());
            List<EmotionEnum> motionJointEmotions = jointMap.getOrDefault(motionId, Collections.emptyList());

            for (EmotionEnum targetEmotion : targetEmotions) {
                if (motionGenreEmotions.contains(targetEmotion)) {
                    totalScore += 1.0;
                }
                if (motionJointEmotions.contains(targetEmotion)) {
                    totalScore += 1.5;
                }
            }

            if (totalScore > 0) {
                scoreMap.put(motionId, totalScore);
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