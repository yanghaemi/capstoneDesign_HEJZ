package com.HEJZ.HEJZ_back.domain.music.service;

import com.HEJZ.HEJZ_back.domain.music.dto.SavedSongDTO;
import com.HEJZ.HEJZ_back.domain.music.dto.SunoRequest;
import com.HEJZ.HEJZ_back.domain.music.dto.SunoResponse;
import com.HEJZ.HEJZ_back.domain.music.entity.SavedSong;
import com.HEJZ.HEJZ_back.domain.music.repository.SavedSongRepository;
import com.HEJZ.HEJZ_back.global.util.HttpUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;

@Service
public class SunoService {

    @Value("${suno.api.key}")
    private String token;

    @Autowired
    private SavedSongRepository savedSongRepository;

    public String generateSong(SunoRequest request) {
        // Suno API로 HTTP 요청 보내는 코드
        String url = "https://apibox.erweima.ai/api/v1/generate";
        HttpURLConnection conn = null;

        HttpUtils httpUtils = new HttpUtils();

        try {

            conn = httpUtils.getHttpURLConnection(url, "POST", token);
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            conn.setDoInput(true); // post 요청 보낼 때 있어야 함

            String str = "{\n" +
                    "\"prompt\": \"" + request.getPrompt() + "\",\n" +
                    "\"style\": \"" + request.getStyle() + "\",\n" +
                    "\"title\": \"" + request.getTitle() + "\",\n" +
                    "\"customMode\": false,\n" +
                    "\"instrumental\": false,\n" +
                    "\"model\": \"" + request.getModel() + "\",\n" +
                    "\"callBackUrl\":\"" + request.getCallBackUrl() + "\",\n" +
                    "}";

            // 1. 먼저 write 해야 함!
            try (DataOutputStream dataOutputStream = new DataOutputStream(conn.getOutputStream())) {
                dataOutputStream.write(str.getBytes(StandardCharsets.UTF_8)); // 한글 깨짐 방지 utf-8 붙임
                dataOutputStream.flush();
            }

            // 2. 그 다음에 응답 읽기
            System.out.println("보낸 JSON: " + str);
            // System.out.println("응답 코드: " + conn.getResponseCode());
            // System.out.println("응답 메시지: " + conn.getResponseMessage());

            return httpUtils.getHttpResponse(conn);

        } catch (IOException e) {

            throw new RuntimeException("Suno API 요청 실패", e);
        } finally {
            if (conn != null)
                conn.disconnect();
        }
    }

    // 콜백 결과 처리 함수
    public List<SavedSongDTO> callbackFromSuno(SunoResponse callback) {
        if (!"complete".equals(callback.getData().getCallbackType())) {
            return List.of();
        }

        List<SunoResponse.AudioData> audioList = callback.getData().getData();

        if (audioList == null || audioList.isEmpty()) {
            return List.of();
        }

        System.out.println("🎧 콜백 데이터: " + callback.getData());

        Path saveDir = Paths.get("music");
        List<SavedSongDTO> savedSongs = new ArrayList<>();

        try {
            if (!Files.exists(saveDir)) {
                Files.createDirectories(saveDir);
            }

            for (SunoResponse.AudioData audio : audioList) {
                String audioUrl = audio.getAudio_url();
                String sourceAudioUrl = audio.getSource_audio_url();
                String streamAudioUrl = audio.getStream_audio_url();
                String sourceStreamAudioUrl = audio.getSource_stream_audio_url();
                String prompt = audio.getPrompt();
                String title = audio.getTitle().replaceAll("\\s+", "_");
                String fileName = title + "_" + System.currentTimeMillis() + ".mp3";
                String lyricsJson = "";
                String plainLyrics = "";
                Path targetPath = saveDir.resolve(fileName);
                String publicUrl = "/music/" + fileName;

                try (InputStream in = new URL(audioUrl).openStream()) {
                    Files.copy(in, targetPath, StandardCopyOption.REPLACE_EXISTING);
                    System.out.println("✅ 저장 성공: " + targetPath);

                    // 엔티티 저장
                    SavedSong entity = new SavedSong();
                    entity.setTitle(title);
                    entity.setAudioUrl(publicUrl);
                    entity.setTaskId(callback.getData().getTask_id());
                    entity.setAudioId(audio.getId());
                    entity.setSourceAudioUrl(sourceAudioUrl);
                    entity.setStreamAudioUrl(streamAudioUrl);
                    entity.setSourceStreamAudioUrl(sourceStreamAudioUrl);
                    entity.setPrompt(prompt);
                    entity.setLyricsJson(lyricsJson);
                    entity.setPlainLyrics(plainLyrics);

                    savedSongRepository.save(entity);

                    // DTO 응답용 추가
                    savedSongs.add(new SavedSongDTO(
                            title,
                            publicUrl,
                            callback.getData().getTask_id(),
                            audio.getId(),
                            sourceAudioUrl,
                            streamAudioUrl,
                            sourceStreamAudioUrl,
                            prompt,
                            lyricsJson,
                            plainLyrics));

                } catch (Exception e) {
                    System.err.println("❌ 저장 실패 for: " + audioUrl);
                    e.printStackTrace();
                }
            }

            return savedSongs;

        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }

    public void updateLyrics(String taskId, String lyricsJson) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode dataArray = mapper.readTree(lyricsJson);

            StringBuilder plainBuilder = new StringBuilder();
            for (JsonNode wordNode : dataArray) {
                plainBuilder.append(wordNode.get("word").asText());
            }
            String plainLyrics = plainBuilder.toString();

            savedSongRepository.findByTaskId(taskId).ifPresent(song -> {
                song.setLyricsJson(lyricsJson);
                song.setPlainLyrics(plainLyrics);
                savedSongRepository.save(song);
            });

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("가사 파싱 중 오류 발생");
        }
    }

    // Get Timestamped Lyrics api 호출 함수
    public String getTimestampLyrics(com.HEJZ.HEJZ_back.domain.music.dto.SunoLyricsDTO request) {

        String url = "https://apibox.erweima.ai/api/v1/generate/get-timestamped-lyrics";

        HttpURLConnection conn = null;

        HttpUtils httpUtils = new HttpUtils();

        try {

            conn = httpUtils.getHttpURLConnection(url, "POST", token);
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            conn.setDoInput(true); // post 요청 보낼 때 있어야 함

            // body string
            String str = "{\n" +
                    "\"taskId\": \"" + request.getTaskId() + "\",\n" +
                    "\"AudioId\": \"" + request.getAudioId() + "\",\n" +
                    "\"musicIndex\": \"" + request.getMusicIndex() + "\",\n" +
                    "}";
            try (DataOutputStream dataOutputStream = new DataOutputStream(conn.getOutputStream())) {
                dataOutputStream.write(str.getBytes(StandardCharsets.UTF_8)); // 한글 깨짐 방지 utf-8 붙임
                dataOutputStream.flush();
            }

            return httpUtils.getHttpResponse(conn);

        } catch (IOException e) {

            throw new RuntimeException("Suno 가사 API 요청 실패", e);
        } finally {
            if (conn != null)
                conn.disconnect();
        }
    }
}
