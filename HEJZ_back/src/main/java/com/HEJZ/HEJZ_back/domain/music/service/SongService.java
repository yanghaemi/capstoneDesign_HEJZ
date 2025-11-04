package com.HEJZ.HEJZ_back.domain.music.service;

import com.HEJZ.HEJZ_back.domain.music.entity.SavedSong;
import com.HEJZ.HEJZ_back.domain.music.repository.SavedSongRepository;
import com.HEJZ.HEJZ_back.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SongService {
    // suno api를 쓰지 않는 u-star 자체 api service

    private final SavedSongRepository SavedSongRepository;

    public ApiResponse<Object> getLyrics(Long songId) {

        try {
            SavedSong song = SavedSongRepository.findById(songId)
                    .orElseThrow(() -> new IllegalArgumentException("해당 id로 가사를 찾을 수 없습니다."));
            ;

            if (song == null) {
                return new ApiResponse<>(404, null, "해당 Id의 노래가 없습니다.");
            }

            String lyrics = song.getPrompt();

            return new ApiResponse<>(200, lyrics, "가사 가져오기 성공");
        } catch (Exception e) {
            return new ApiResponse<>(500, null, "가사 가져오기 실패");
        }

    }

    public ApiResponse<Object> getSong(Long songId) {

        try {
            SavedSong song = SavedSongRepository.findById(songId)
                    .orElseThrow(() -> new IllegalArgumentException("해당 id로 곡을 찾을 수 없습니다."));
            ;
            if (song == null) {
                return new ApiResponse<>(404, song, "해당 taskId의 노래가 없습니다.");
            }

            return new ApiResponse<>(200, song, "가사 가져오기 성공");
        } catch (Exception e) {
            return new ApiResponse<>(500, null, "가사 가져오기 실패");
        }

    }
}
