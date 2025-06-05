package com.HEJZ.HEJZ_back.global.exception;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Schema(description = "에러 응답 모델")
public class ErrorResponse {

    @Schema(description = "에러 코드", example = "G001")
    private final String code;

    @Schema(description = "에러 메시지", example = "감정 분석 API 호출 실패")
    private final String message;
}
