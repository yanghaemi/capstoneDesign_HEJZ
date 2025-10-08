package com.HEJZ.HEJZ_back.domain.dance.model;

import com.HEJZ.HEJZ_back.global.exception.CustomException;
import com.HEJZ.HEJZ_back.global.exception.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;


public enum EmotionEnum {
    행복,
    슬픔,
    분노,
    공포,
    놀람,
    혐오,
    사랑,
    희망,
    열정,
    자신감,
    매혹,
    도전,
    차분함;

    private static final Map<String, EmotionEnum> EMOTION_KEYWORD_MAP = Map.of(
            "즐거움", EmotionEnum.행복,
            "기쁨", EmotionEnum.행복,
            "신남", EmotionEnum.행복,
            "짜증", EmotionEnum.분노,
            "우울", EmotionEnum.슬픔
            // 필요하면 더 추가 가능
    );


    private static final Logger log = LoggerFactory.getLogger(EmotionEnum.class);

    // 감정 문자열이 enum에 포함되어 있는지 확인 (대소문자 무시)
    public static EmotionEnum fromString(String emotion) {
        // 1. 직접 매칭
        for (EmotionEnum e : EmotionEnum.values()) {
            if (e.name().equalsIgnoreCase(emotion)) {
                return e;
            }
        }

        // 2. 매핑 테이블에서 찾기
        EmotionEnum mapped = EMOTION_KEYWORD_MAP.get(emotion);
        if (mapped != null) {
            return mapped;
        }

        // 3. 둘 다 안 맞으면 예외
        log.warn("유효하지 않은 감정 키워드: {}", emotion);
        throw new CustomException(ErrorCode.INVALID_EMOTION);
    }



}