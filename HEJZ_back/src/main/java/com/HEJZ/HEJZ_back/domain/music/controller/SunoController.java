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
    // 곡 생성 api
    // method: post
    @PostMapping("/generate")
    public ResponseEntity<String> generateSong(@RequestBody SunoRequest request) {
        String result = sunoService.generateSong(request);
        System.out.println("곡 생성: "+result);
        return ResponseEntity.ok(result);
    }

    // 호출 url : http://localhost:8080/api/suno/callback
    // 콜백 받는 url : 곡 생성시 callbackurl을 이 url로 사용해서 (ngrok으로 외부랑 연결해야 됨) 음악 url으로 음악 저장
    // method: post
    @PostMapping("/callback")
    public ResponseEntity<String> callbackSong(@RequestBody SunoResponse callback_res) {
        System.out.println("taskId: " + callback_res.getData().getTask_id());
        System.out.println("✅ 콜백 성공! data size: " + callback_res.getData().getData().size());
        String result = sunoService.callbackFromSuno(callback_res);
//        System.out.println("콜백: "+result);
        return ResponseEntity.ok(result);
    }

     /*
     호출 url : http://localhost:8080/api/suno/lyrics
     가사 호출 api
     method: post
      */
    @PostMapping("/lyrics")
    public ResponseEntity<String> getLyrics(@RequestBody com.HEJZ.HEJZ_back.dto.LyricsDTO request) {
        String result = sunoService.getLyrics(request);
        System.out.println("타임스탬프: "+result);
        return ResponseEntity.ok(result);
    }
}
