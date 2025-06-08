package com.HEJZ.HEJZ_back.global.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // === 감정 분석 관련 ===
    CHATGPT_API_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "G001", "감정 분석 API 호출 실패"),
    DB_SAVE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "G002", "감정 분석 결과 저장 실패"),
    INVALID_EMOTION(HttpStatus.BAD_REQUEST, "G003", "유효하지 않은 감정 키워드입니다."),
    EMPTY_LYRICS(HttpStatus.BAD_REQUEST, "G004", "가사가 비어 있습니다."),
    INVALID_LYRICS_FORMAT(HttpStatus.BAD_REQUEST, "G005", "2줄 이상의 가사를 입력해주세요."),
    RECOMMENDATION_FAILED(HttpStatus.NOT_FOUND, "G006", "추천 결과가 존재하지 않습니다."),
    VIDEO_NOT_FOUND(HttpStatus.NOT_FOUND, "G007", "해당 안무 영상이 존재하지 않습니다."),

    // === 시스템 에러 ===
    CSV_LOADING_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "S001", "CSV 파일 로딩 실패"),
    UNKNOWN_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "S999", "알 수 없는 서버 에러"),

    // === 노래 관련 ===
    GET_LYRICS_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "S001", "가사 가져오기 실패");

    private final HttpStatus status;
    private final String code;
    private final String message;

    ErrorCode(HttpStatus status, String code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }
}
