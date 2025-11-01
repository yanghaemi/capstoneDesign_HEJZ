package com.HEJZ.HEJZ_back.domain.music.controller;

import com.HEJZ.HEJZ_back.domain.music.dto.*;
import com.HEJZ.HEJZ_back.domain.music.entity.SavedSong;
import com.HEJZ.HEJZ_back.domain.music.repository.SavedSongRepository;
import com.HEJZ.HEJZ_back.domain.music.service.SunoService;

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
        System.out.println("콜백 받은 거: " + callback);
        if (callback == null || callback.getData() == null) {
            return ResponseEntity.badRequest().build();
        }
        System.out.println("taskId: " + callback.getData().getTask_id());
        var list = callback.getData().getData();
        System.out.println("✅ 콜백 성공! data size: " + (list == null ? 0 : list.size()));
        List<SavedSongDTO> result = sunoService.callbackFromSuno(callback);
        System.out.println("ㅠㅠ콜백: " + result);
        return ResponseEntity.ok(result);
    }

    /*
     * 호출 url : http://localhost:8080/api/suno/get_timestamplyrics
     * 설명 : 가사 호출 api
     * method: post
     */
    @PostMapping("/get_timestamplyrics")
    public ResponseEntity<?> getTimestampLyrics(
            @RequestBody SunoLyricsDTO request) {

        try {

            var taskId = request.getTaskId();
            var audioId = request.getAudioId();

            var alreadySaved = savedSongRepository.existsTimestampPayload(taskId, audioId);

            if (alreadySaved) {
                return ResponseEntity.ok(Map.of(
                        "status", "skip",
                        "reason", "timestamped lyrics already stored"));
            }
            String resp = sunoService.getTimestampLyrics(request);
            sunoService.saveTimestampResponse(taskId, audioId, resp);

            // 2. 저장 후 DB에서 다시 확인
            var songOpt = savedSongRepository.findByTaskIdAndAudioId(request.getTaskId(), request.getAudioId());

            System.out.println(songOpt);

            if (songOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("해당 taskId의 저장된 곡을 찾을 수 없습니다.");
            }

            SavedSong song = songOpt.get();

            // 3. 리턴 dto
            Map<String, Object> response = Map.of(
                    "taskId", song.getTaskId(),
                    "plainLyrics", song.getPlainLyrics(),
                    "hootCer", song.getHootCer(),
                    "isStreamed", song.getIsStreamed());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("가사 저장 실패");
        }
    }

    @GetMapping("/getSongs")
    public ResponseEntity<List<SavedSongDTO>> getSongs() {
        // 엔티티-> DTO 변환
        List<SavedSong> songs = savedSongRepository.findTop20ByOrderByCreatedAtDesc();
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
