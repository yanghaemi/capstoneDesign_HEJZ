package com.HEJZ.HEJZ_back.domain.music.service;

import com.HEJZ.HEJZ_back.domain.music.dto.SavedSongDTO;
import com.HEJZ.HEJZ_back.domain.music.dto.SunoLyricsDTO;
import com.HEJZ.HEJZ_back.domain.music.dto.SunoRequest;
import com.HEJZ.HEJZ_back.domain.music.dto.SunoResponse;
import com.HEJZ.HEJZ_back.domain.music.entity.SavedSong;
import com.HEJZ.HEJZ_back.domain.music.repository.SavedSongRepository;
import com.HEJZ.HEJZ_back.global.util.HttpUtils;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
        String url = "https://api.sunoapi.org/api/v1/generate";
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
        System.out.println(callback);

        if (!"complete".equals(callback.getData().getCallbackType())) {
            return List.of();
        }

        List<SunoResponse.AudioData> audioList = callback.getData().getData();

        if (audioList == null || audioList.isEmpty()) {
            System.err.println("⚠️ audioList 없음");
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
                String title = audio.getTitle().replaceAll("\\s+", "_");
                String audioUrl = audio.getAudio_url();
                String sourceAudioUrl = audio.getSource_audio_url();
                String streamAudioUrl = audio.getStream_audio_url();
                String sourceStreamAudioUrl = audio.getSource_stream_audio_url();
                String prompt = audio.getPrompt();
                String fileName = title + "_" + System.currentTimeMillis() + ".mp3";
                String lyricsJson = "";
                String plainLyrics = "";
                Path targetPath = saveDir.resolve(fileName);
                String publicUrl = "/music/" + fileName;

                try (InputStream in = new URL(audioUrl).openStream()) {
                    Files.copy(in, targetPath, StandardCopyOption.REPLACE_EXISTING);
                    System.out.println("✅ 저장 성공: " + targetPath);

                    // 엔티티 저장
                    SavedSong entity = SavedSong.builder()
                            .title(title)
                            .audioUrl(publicUrl)
                            .taskId(callback.getData().getTask_id())
                            .audioId(audio.getId())
                            .sourceAudioUrl(sourceAudioUrl)
                            .streamAudioUrl(streamAudioUrl)
                            .sourceStreamAudioUrl(sourceStreamAudioUrl)
                            .prompt(prompt)
                            .lyricsJson(lyricsJson) // 이후 가사 동기화에서 업데이트
                            .plainLyrics(plainLyrics) // 이후 가사 동기화에서 업데이트
                            .build();
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

    public void saveTimestampResponse(String taskId, String audioId, String responseJson) {
        try {

            if (responseJson == null || responseJson.isBlank()) {
                System.err.println("[Suno] responseJson is null/blank. taskId=" + taskId);
                return;
            }

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(responseJson);
            JsonNode data = root.path("data");

            // 1) alignedWords 배열 찾기
            JsonNode aligned = data.path("alignedWords");
            if (!aligned.isArray() || aligned.size() == 0) {
                throw new IllegalStateException("alignedWords 가 비어있거나 배열이 아닙니다.");
            }

            System.out.println(aligned);

            // 2) plainLyrics 생성 (개행 유지)
            StringBuilder plain = new StringBuilder();
            for (JsonNode w : aligned) {
                String token = w.path("word").asText("");
                // 앞뒤 불필요한 공백만 정리 (개행은 살림)
                // - 연속 공백은 하나로
                // - 개행 앞뒤 스페이스는 제거
                token = token
                        .replaceAll("[ \\t\\x0B\\f\\r]+", " ") // 연속 공백 → 1칸
                        .replaceAll(" *\\n+ *", "\n"); // 개행 주변 공백 제거
                plain.append(token);
                // 단어 사이 공백은 이미 token에 포함되어 오므로 추가 스페이스는 넣지 않음
            }
            String plainLyrics = plain.toString().trim();

            // 3) waveformData / hootCer / isStreamed
            JsonNode waveform = data.path("waveformData"); // 배열
            Double hootCer = data.has("hootCer") ? data.get("hootCer").asDouble() : null;
            Boolean isStreamed = data.has("isStreamed") ? data.get("isStreamed").asBoolean() : null;

            // 4) 저장
            savedSongRepository.findByTaskIdAndAudioId(taskId, audioId).ifPresent(song -> {
                try {
                    // JSON 문자열로 보관
                    song.setLyricsJson(mapper.writeValueAsString(aligned));
                    song.setPlainLyrics(plainLyrics);

                    if (waveform != null && waveform.isArray()) {
                        song.setWaveformJson(mapper.writeValueAsString(waveform));
                    }
                    song.setHootCer(hootCer);
                    song.setIsStreamed(isStreamed);

                    savedSongRepository.save(song);
                } catch (JsonProcessingException e) {
                    throw new RuntimeException("waveform/alignedWords 직렬화 실패", e);
                }
            });

        } catch (Exception e) {
            System.err.println("[Suno] saveTimestampResponse error: " + e.getMessage());
            if (responseJson != null) {
                System.err.println("[Suno] raw: " + responseJson.substring(0, Math.min(700, responseJson.length())));
            }
            throw new RuntimeException("타임스탬프 응답 저장 실패", e);
        }
    }

    public void fetchAndStoreLyrics(SunoLyricsDTO request) {

        String resp = getTimestampLyrics(request);

        saveTimestampResponse(request.getTaskId(), request.getAudioId(), resp);
    }

    // Get Timestamped Lyrics api 호출 함수
    public String getTimestampLyrics(SunoLyricsDTO request) {

        String url = "https://api.sunoapi.org/api/v1/generate/get-timestamped-lyrics";

        HttpURLConnection conn = null;

        try {

            HttpUtils httpUtils = new HttpUtils();

            conn = httpUtils.getHttpURLConnection(url, "POST", token);
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            conn.setDoOutput(true); // post body 보내려면 true
            conn.setDoInput(true);

            // body string
            String str = "{\n" +
                    "\"taskId\": \"" + request.getTaskId() + "\",\n" +
                    "\"audioId\": \"" + request.getAudioId() + "\",\n" +
                    "\"musicIndex\": \"" + request.getMusicIndex() + "\"" +
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
