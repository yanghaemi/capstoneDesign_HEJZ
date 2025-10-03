package com.HEJZ.HEJZ_back.domain.music.controller;

import com.HEJZ.HEJZ_back.domain.music.dto.SongSaveLyricsDTO;
import com.HEJZ.HEJZ_back.domain.music.service.SongService;
import com.HEJZ.HEJZ_back.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor    // 생성자 자동으로 주입하는 어노테이션
@RequestMapping("api/song")
public class SongController{
    private final SongService songService;

    /*
    * 호출 url : http://localhost:8080/api/song/getlyrics
    * 설명 : DB에 저장되어있는 가사 가져오는 api
    * method : get
    *  */
    @GetMapping("getlyrics")
    public ResponseEntity<ApiResponse<Object>> getLyrics(@RequestParam String taskid) {
        ResponseEntity<ApiResponse<Object>> result = songService.getLyrics(taskid);
        System.out.println("get Lyrics: " + result);
        return result;
    }

    /*
    호출 url : http://localhost:8080/api/song/savelyrics
    설명 : suno에서 가져온 가사 (timestamp 있는 버전)를 프론트에 불러오기 쉽게 한 줄 씩 포맷하고 db에 저장하는 api
    method : post
     */
    @PostMapping("savelyrics")
    public ResponseEntity<String> saveLyrics(@RequestBody SongSaveLyricsDTO request){
        String result = songService.saveLyrics(request);
        System.out.println("save Lyrics: "+ result);
        return ResponseEntity.ok(result);
    }

}

