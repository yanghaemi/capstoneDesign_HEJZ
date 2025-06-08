package com.HEJZ.HEJZ_back.domain.dance.service;

import com.HEJZ.HEJZ_back.domain.dance.model.EmotionEnum;
import com.HEJZ.HEJZ_back.global.exception.CustomException;
import com.HEJZ.HEJZ_back.global.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.List;
import java.util.Map;

@Service
public class EmotionAnalyzerService {

    @Value("${openai.api.key}")
    private String openaiApiKey;

    @Value("${openai.api.model}")  // application.yml에 정의
    private String openaiModel;


    private static final String ENDPOINT = "https://api.openai.com/v1/chat/completions";
    private static final List<String> EMOTIONS = List.of(
            "사랑", "슬픔", "행복", "분노", "희망", "열정", "자신감", "혐오", "공포", "놀람", "즐거움", "차분함", "도전", "매혹"
    );

    public EmotionEnum analyzeEmotion(String lyricsChunk) {
        RestTemplate restTemplate = new RestTemplate();

        String prompt = buildPrompt(lyricsChunk);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openaiApiKey);

        Map<String, Object> requestBody = Map.of(
                "model", openaiModel,
                "messages", List.of(
                        Map.of("role", "system", "content", "다음 가사 2줄을 읽고 아래 감정 키워드 중 가장 어울리는 하나만 정확히 골라줘."),
                        Map.of("role", "user", "content", prompt)
                ),
                "temperature", 0.3
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        ResponseEntity<Map> response = restTemplate.postForEntity(ENDPOINT, request, Map.class);

        String reply = extractReply(response);
        return EmotionEnum.fromString(reply);
    }
    /*public EmotionEnum analyzeEmotion(String lyricsChunk) {
        System.out.println("▶ 테스트용 가사: " + lyricsChunk);
        return EmotionEnum.행복;  // 테스트용으로 무조건 행복 반환
    }*/


    private String buildPrompt(String lyricsChunk) {
        return String.format("""
            다음 감정 키워드 중 하나만 골라서 출력해줘.  
            🚫 아래 키워드 외의 단어는 절대 사용하지 마!

            감정 키워드 목록: [%s]

            가사:
            %s

            응답 형식 예시:
            열정

            위 목록 중에서 하나만 골라서 정확히 감정 키워드만 출력해줘. 다른 설명 없이 감정 하나만!
""", String.join(", ", EMOTIONS), lyricsChunk);

    }

    private String extractReply(ResponseEntity<Map> response) {
        try {
            Map<String, Object> responseBody = response.getBody();
            System.out.println("📦 OpenAI 응답: " + responseBody);

            if (responseBody == null || !responseBody.containsKey("choices")) {
                throw new CustomException(ErrorCode.CHATGPT_API_FAILED);
            }

            List<?> choices = (List<?>) responseBody.get("choices");
            if (choices == null || choices.isEmpty()) {
                throw new CustomException(ErrorCode.CHATGPT_API_FAILED);
            }

            Object firstChoice = choices.get(0);
            if (!(firstChoice instanceof Map)) {
                throw new CustomException(ErrorCode.CHATGPT_API_FAILED);
            }

            Map<?, ?> choiceMap = (Map<?, ?>) firstChoice;
            Object messageObj = choiceMap.get("message");
            if (!(messageObj instanceof Map)) {
                throw new CustomException(ErrorCode.CHATGPT_API_FAILED);
            }

            Map<?, ?> messageMap = (Map<?, ?>) messageObj;
            Object content = messageMap.get("content");
            if (!(content instanceof String)) {
                throw new CustomException(ErrorCode.CHATGPT_API_FAILED);
            }

            return ((String) content).trim();
        } catch (Exception e) {
            e.printStackTrace(); // 콘솔 확인용 로그
            throw new CustomException(ErrorCode.CHATGPT_API_FAILED);
        }
    }

}
