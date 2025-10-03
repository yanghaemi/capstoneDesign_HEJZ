package com.HEJZ.HEJZ_back.global.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ApiResponse<T> {
    private int code;     // ex: 200, 400, 500
    private T data;       // 실제 응답 데이터
    private String msg;   // 메시지 ("OK", "Failed" 등)
}