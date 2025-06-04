package com.HEJZ.HEJZ_back.domain.music.controller;

import com.HEJZ.HEJZ_back.domain.music.dto.SunoRequest;
import com.HEJZ.HEJZ_back.domain.music.dto.SunoResponse;
import com.HEJZ.HEJZ_back.domain.music.service.SunoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


// 프론트에서 요청 받은 거 처리하는 곳

@RestController
@RequiredArgsConstructor    // 생성자 자동으로 주입하는 어노테이션
@RequestMapping("api/suno")
public class SunoController {

    private final SunoService sunoService;

    // 호출 url : http://localhost:8080/api/suno/generate
    @PostMapping("/generate")
    public ResponseEntity<String> generateSong(@RequestBody SunoRequest request) {
        String response = sunoService.requestToSuno(request);
        return ResponseEntity.ok(response);
    }

    // 호출 url : http://localhost:8080/api/suno/callback
    @PostMapping("/callback")
    public ResponseEntity<String> callbackSong(@RequestBody SunoResponse callback_res) {
        System.out.println("✅ 콜백 성공! data size: " + callback_res.getData().getData().size());
        String result = sunoService.callbackFromSuno(callback_res);
        return ResponseEntity.ok(result);
    }
}
