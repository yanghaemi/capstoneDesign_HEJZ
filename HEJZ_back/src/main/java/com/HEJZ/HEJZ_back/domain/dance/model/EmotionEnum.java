package com.HEJZ.HEJZ_back.domain.dance.model;

import com.HEJZ.HEJZ_back.global.exception.CustomException;
import com.HEJZ.HEJZ_back.global.exception.ErrorCode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


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

    private static final Logger log = LoggerFactory.getLogger(EmotionEnum.class);

    // 감정 문자열이 enum에 포함되어 있는지 확인 (대소문자 무시)
    public static EmotionEnum fromString(String emotion) {

        for (EmotionEnum e : EmotionEnum.values()) {
            if (e.name().equalsIgnoreCase(emotion)) {
                return e;
            }
        }
        log.warn("유효하지 않은 감정 키워드: {}", emotion);
        throw new CustomException(ErrorCode.INVALID_EMOTION);
    }


}