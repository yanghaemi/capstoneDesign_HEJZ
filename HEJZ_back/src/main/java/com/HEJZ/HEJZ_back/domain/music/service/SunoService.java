package com.HEJZ.HEJZ_back.domain.music.service;

import com.HEJZ.HEJZ_back.domain.music.dto.SunoRequest;
import com.HEJZ.HEJZ_back.domain.music.dto.SunoResponse;
import com.HEJZ.HEJZ_back.dto.SunoLyricsDTO;
import com.HEJZ.HEJZ_back.global.util.HttpUtils;
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
import java.util.List;

@Service
public class SunoService {

    @Value("${suno.api.key}")
    private String token;

    public String generateSong(SunoRequest request) {
        String url = "https://apibox.erweima.ai/api/v1/generate";
        HttpURLConnection conn = null;

        HttpUtils httpUtils = new HttpUtils();

        try {
            conn = httpUtils.getHttpURLConnection(url, "POST", token);
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            conn.setDoInput(true);

            String str = "{\n" +
                    "\"prompt\": \"" + request.getPrompt() + "\",\n" +
                    "\"style\": \"" + request.getStyle() + "\",\n" +
                    "\"title\": \"" + request.getTitle() + "\",\n" +
                    "\"customMode\": false,\n" +
                    "\"instrumental\": false,\n" +
                    "\"model\": \"" + request.getModel() + "\",\n" +
                    "\"callBackUrl\":\"" + request.getCallBackUrl() + "\"\n" +
                    "}";

            try (DataOutputStream dataOutputStream = new DataOutputStream(conn.getOutputStream())) {
                dataOutputStream.write(str.getBytes(StandardCharsets.UTF_8));
                dataOutputStream.flush();
            }

            System.out.println("보낸 JSON: " + str);
            return httpUtils.getHttpResponse(conn);

        } catch (IOException e) {
            throw new RuntimeException("Suno API 요청 실패", e);
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    public String callbackFromSuno(SunoResponse callback) {
        if (!"complete".equals(callback.getData().getCallbackType())) {
            return "⚠️ 곡 생성 완료 상태가 아님: " + callback.getData().getCallbackType();
        }

        List<SunoResponse.AudioData> audioList = callback.getData().getData();
        if (audioList == null || audioList.isEmpty()) {
            return "❌ 콜백에 오디오 데이터가 없음";
        }

        Path saveDir = Paths.get("../../HEJZ_front/android/app/src/main/res/raw");

        try {
            if (!Files.exists(saveDir)) {
                Files.createDirectories(saveDir);
            }

            for (SunoResponse.AudioData audio : audioList) {
                String audioUrl = audio.getAudio_url();
                String title = audio.getTitle().replaceAll("\\s+", "_");
                String fileName = title + "_" + System.currentTimeMillis() + ".mp3";
                Path targetPath = saveDir.resolve(fileName);

                try (InputStream in = new URL(audioUrl).openStream()) {
                    Files.copy(in, targetPath, StandardCopyOption.REPLACE_EXISTING);
                    System.out.println("✅ 저장 성공: " + targetPath);
                } catch (Exception e) {
                    System.err.println("❌ 저장 실패 for: " + audioUrl);
                    e.printStackTrace();
                }
            }

            return "✅ 모든 mp3 저장 완료";
        } catch (Exception e) {
            e.printStackTrace();
            return "❌ 전체 저장 중 예외 발생: " + e.getMessage();
        }
    }

    public String getTimestampLyrics(SunoLyricsDTO request) {
        String url = "https://apibox.erweima.ai/api/v1/generate/get-timestamped-lyrics";
        HttpURLConnection conn = null;

        HttpUtils httpUtils = new HttpUtils();

        try {
            conn = httpUtils.getHttpURLConnection(url, "POST", token);
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            conn.setDoInput(true);

            String str = "{\n" +
                    "\"taskId\": \"" + request.getTaskId() + "\",\n" +
                    "\"AudioId\": \"" + request.getAudioId() + "\",\n" +
                    "\"musicIndex\": \"" + request.getMusicIndex() + "\"\n" +
                    "}";

            try (DataOutputStream dataOutputStream = new DataOutputStream(conn.getOutputStream())) {
                dataOutputStream.write(str.getBytes(StandardCharsets.UTF_8));
                dataOutputStream.flush();
            }

            return httpUtils.getHttpResponse(conn);

        } catch (IOException e) {
            throw new RuntimeException("Suno 가사 API 요청 실패", e);
        } finally {
            if (conn != null) conn.disconnect();
        }
    }
}
