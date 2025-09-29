package com.HEJZ.HEJZ_back.domain.music.controller;

import com.HEJZ.HEJZ_back.domain.music.dto.SavedSongDTO;
import com.HEJZ.HEJZ_back.domain.music.dto.SunoRequest;
import com.HEJZ.HEJZ_back.domain.music.dto.SunoResponse;
import com.HEJZ.HEJZ_back.domain.music.entity.SavedSong;
import com.HEJZ.HEJZ_back.domain.music.repository.SavedSongRepository;
import com.HEJZ.HEJZ_back.domain.music.service.SunoService;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
// 프론트에서 요청 받은 거 처리하는 곳

@RestController
@RequiredArgsConstructor // 생성자 자동으로 주입하는 어노테이션
@RequestMapping("api/suno")
public class SunoController {

    private final SunoService sunoService;

    @Autowired
    private SavedSongRepository savedSongRepository;

    // 호출 url : http://localhost:8080/api/suno/generate
    // 곡 생성 api
    // method: post
    @PostMapping("/generate")
    public ResponseEntity<String> generateSong(@RequestBody SunoRequest request) {
        String result = sunoService.generateSong(request);
        System.out.println("곡 생성: " + result);
        return ResponseEntity.ok(result);
    }

    // 호출 url : http://localhost:8080/api/suno/callback
    // 콜백 받는 url : 곡 생성시 callbackurl을 이 url로 사용해서 (ngrok으로 외부랑 연결해야 됨) 음악 url으로 음악
    // 저장
    // method: post
    @PostMapping("/callback")
    public ResponseEntity<List<SavedSongDTO>> callbackSong(@RequestBody SunoResponse callback) {
        System.out.println("taskId: " + callback.getData().getTask_id());
        System.out.println("✅ 콜백 성공! data size: " + callback.getData().getData().size());
        List<SavedSongDTO> result = sunoService.callbackFromSuno(callback);
        // System.out.println("콜백: "+result);
        return ResponseEntity.ok(result);
    }

    /*
     * 호출 url : http://localhost:8080/api/suno/get_timestamplyrics
     * 설명 : 가사 호출 api
     * method: post
     */
    @PostMapping("/get_timestamplyrics")
    public ResponseEntity<?> getTimestampLyrics(
            @RequestBody com.HEJZ.HEJZ_back.domain.music.dto.SunoLyricsDTO request) {
        String result = sunoService.getTimestampLyrics(request);
        try {
            // JSON 파싱: result는 JSON string
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> parsed = mapper.readValue(result, new TypeReference<>() {
            });

            // data 안에 alignedWords가 있을 경우 한 번 더 추출
            // data 꺼내기
            Map<String, Object> data = (Map<String, Object>) parsed.get("data"); // alignedWords 꺼내기
            List<Map<String, Object>> alignedWords = (List<Map<String, Object>>) data.get("alignedWords");

            return ResponseEntity.ok(alignedWords); // 👉 최종적으로 alignedWords만 리턴

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("가사 파싱 실패");
        }
    }

    @GetMapping("/latest")
    public ResponseEntity<List<SavedSongDTO>> getLatestSongs() {
        // 엔티티-> DTO 변환
        List<SavedSong> songs = savedSongRepository.findTop5ByOrderByCreatedAtDesc();
        List<SavedSongDTO> dtos = songs.stream()
                .map(song -> new SavedSongDTO(
                        song.getTitle(),
                        song.getTaskId(),
                        song.getAudioId(),
                        song.getAudioUrl(),
                        song.getSourceAudioUrl(),
                        song.getStreamAudioUrl(),
                        song.getSourceStreamAudioUrl(),
                        song.getPrompt(),
                        song.getLyricsJson(),
                        song.getPlainLyrics()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

}
