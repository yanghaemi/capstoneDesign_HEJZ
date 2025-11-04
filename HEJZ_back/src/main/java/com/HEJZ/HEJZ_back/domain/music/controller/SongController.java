package com.HEJZ.HEJZ_back.domain.music.controller;

import com.HEJZ.HEJZ_back.domain.music.dto.SongLyricsRequest;
import com.HEJZ.HEJZ_back.domain.music.dto.SongRequest;
import com.HEJZ.HEJZ_back.domain.music.service.SongService;
import com.HEJZ.HEJZ_back.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor // 생성자 자동으로 주입하는 어노테이션
@RequestMapping("api/song")
public class SongController {
    private final SongService songService;

    /*
     * 호출 url : http://localhost:8080/api/song/getlyrics
     * 설명 : DB에 저장되어있는 가사 가져오는 api
     * method : post
     */
    @PostMapping("getlyrics")
    public ResponseEntity<ApiResponse<Object>> getLyrics(@RequestBody SongLyricsRequest request) {
        ApiResponse<Object> result = songService.getLyrics(request.getSongId());
        System.out.println("get Lyrics: " + result);
        return ResponseEntity.ok(result);
    }

    /*
     * 호출 url : http://localhost:8080/api/song/getsong
     * 설명 : DB에 저장되어있는 곡 가져오는 api
     * method : post
     */
    @PostMapping("getsong")
    public ResponseEntity<ApiResponse<Object>> getsong(@RequestBody SongRequest request) {
        ApiResponse<Object> result = songService.getSong(request.songId());
        System.out.println("get song: " + result);
        return ResponseEntity.ok(result);
    }
}
