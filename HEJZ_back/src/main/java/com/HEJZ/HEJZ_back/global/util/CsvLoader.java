package com.HEJZ.HEJZ_back.global.util;

import com.HEJZ.HEJZ_back.domain.dance.model.EmotionEnum;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Component
public class CsvLoader {

    private static final Logger log = LoggerFactory.getLogger(CsvLoader.class);

    private final Map<String, List<EmotionEnum>> genreEmotionMap = new HashMap<>();
    private final Map<String, List<EmotionEnum>> jointEmotionMap = new HashMap<>();
    private final Map<String, EmotionEnum> emotionIdToEnumMap = new HashMap<>();
    private final Set<EmotionEnum> validEmotions = new HashSet<>();

    public void init() {
        loadEmotionTable("emotion_table.csv");
        loadGenreEmotion("genre_emotion_results.csv");
        loadJointEmotion("joint_emotion_results.csv");
    }

    private void loadEmotionTable(String path) {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                Objects.requireNonNull(getClass().getClassLoader().getResourceAsStream(path)), StandardCharsets.UTF_8))) {

            String line;
            br.readLine(); // skip header
            while ((line = br.readLine()) != null) {
                String[] tokens = line.split(",");
                if (tokens.length < 2) continue;

                String id = tokens[0].trim();
                String name = tokens[1].trim();

                EmotionEnum emotion = EmotionEnum.fromString(name);
                emotionIdToEnumMap.put(id, emotion);
                validEmotions.add(emotion);
            }

            log.info("감정 테이블 로딩 완료: {}", emotionIdToEnumMap);

        } catch (Exception e) {
            throw new RuntimeException("감정 키워드 테이블 CSV 읽기 실패", e);
        }
    }

    private void loadGenreEmotion(String path) {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                Objects.requireNonNull(getClass().getClassLoader().getResourceAsStream(path)), StandardCharsets.UTF_8))) {

            String line;
            br.readLine(); // skip header
            while ((line = br.readLine()) != null) {
                String[] tokens = line.split(",");
                if (tokens.length < 3) continue;

                String emotionId = tokens[1].trim();
                String motionId = tokens[2].trim();

                EmotionEnum emotion = emotionIdToEnumMap.get(emotionId);
                if (emotion == null) {
                    log.warn("장르 감정 ID '{}'를 EmotionEnum으로 매핑할 수 없음", emotionId);
                    continue;
                }

                genreEmotionMap.computeIfAbsent(motionId, k -> new ArrayList<>());
                List<EmotionEnum> emotionList = genreEmotionMap.get(motionId);
                if (emotionList.size() < 3 && !emotionList.contains(emotion)) {
                    emotionList.add(emotion);
                }
            }

            log.info("장르 기반 감정 로딩 완료. {}개", genreEmotionMap.size());

        } catch (Exception e) {
            throw new RuntimeException("장르 기반 감정 매핑 CSV 읽기 실패", e);
        }
    }

    private void loadJointEmotion(String path) {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(
                Objects.requireNonNull(getClass().getClassLoader().getResourceAsStream(path)), StandardCharsets.UTF_8))) {

            String line;
            br.readLine(); // skip header
            while ((line = br.readLine()) != null) {
                String[] tokens = line.split(",");
                if (tokens.length < 2) continue;

                String motionId = tokens[0].trim();

                jointEmotionMap.computeIfAbsent(motionId, k -> new ArrayList<>());
                List<EmotionEnum> emotionList = jointEmotionMap.get(motionId);

                for (int i = 1; i < tokens.length; i++) {
                    String emotionName = tokens[i].trim();
                    if (emotionName.isEmpty()) continue;

                    EmotionEnum emotion = EmotionEnum.fromString(emotionName);
                    if (emotion != null && !emotionList.contains(emotion) && emotionList.size() < 2) {
                        emotionList.add(emotion);
                    }
                }
            }

            log.info("관절 기반 감정 로딩 완료. {}개", jointEmotionMap.size());

        } catch (Exception e) {
            throw new RuntimeException("관절 기반 감정 매핑 CSV 읽기 실패", e);
        }
    }

    public Map<String, List<EmotionEnum>> getGenreEmotionMap() {
        return genreEmotionMap;
    }

    public Map<String, List<EmotionEnum>> getJointEmotionMap() {
        return jointEmotionMap;
    }

    public Set<EmotionEnum> getValidEmotions() {
        return validEmotions;
    }
}
