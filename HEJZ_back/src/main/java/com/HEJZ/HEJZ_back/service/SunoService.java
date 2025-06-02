package com.HEJZ.HEJZ_back.service;

import com.HEJZ.HEJZ_back.dto.LyricsDTO;
import com.HEJZ.HEJZ_back.dto.SunoRequest;
import com.HEJZ.HEJZ_back.dto.SunoResponse;
import com.HEJZ.HEJZ_back.util.HttpUtils;
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

    @Value("${suno.token}")
    private String token;
    public String generateSong(SunoRequest request){
        // Suno API로 HTTP 요청 보내는 코드
        String url = "https://apibox.erweima.ai/api/v1/generate";
        HttpURLConnection conn = null;

        HttpUtils httpUtils = new HttpUtils();

        try{

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
                    "\"callBackUrl\":\"" +request.getCallBackUrl() +"\",\n" +
                    "}";



            // 1. 먼저 write 해야 함!
            try (DataOutputStream dataOutputStream = new DataOutputStream(conn.getOutputStream())) {
                dataOutputStream.write(str.getBytes(StandardCharsets.UTF_8)); // 한글 깨짐 방지 utf-8 붙임
                dataOutputStream.flush();
            }

            // 2. 그 다음에 응답 읽기
            System.out.println("보낸 JSON: " + str);
//            System.out.println("응답 코드: " + conn.getResponseCode());
            //System.out.println("응답 메시지: " + conn.getResponseMessage());

            return httpUtils.getHttpResponse(conn);

        }catch (IOException e) {

            throw new RuntimeException("Suno API 요청 실패", e);
        }
        finally{
            if(conn!=null) conn.disconnect();
        }
    }

    // 콜백 결과 처리 함수
    public String callbackFromSuno(SunoResponse callback) {
        if (!"complete".equals(callback.getData().getCallbackType())) {
            return "⚠️ 곡 생성 완료 상태가 아님: " + callback.getData().getCallbackType();
        }

        List<SunoResponse.AudioData> audioList = callback.getData().getData();

        if (audioList == null || audioList.isEmpty()) {
            return "❌ 콜백에 오디오 데이터가 없음";
        }

        Path saveDir = Paths.get("../music");
        try {
            if (!Files.exists(saveDir)) {
                Files.createDirectories(saveDir);
            }

            for (SunoResponse.AudioData audio : audioList) {
                String audioUrl = audio.getAudio_url();
                String title = audio.getTitle().replaceAll("\\s+", "_"); // 공백 제거
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

    // Get Timestamped Lyrics api 호출 함수
//    public String getLyrics(LyricsDTO request){
//
//        String url = "https://apibox.erweima.ai/api/v1/generate/get-timestamped-lyrics";
//
//        HttpURLConnection conn = null;
//
//        HttpUtils httpUtils = new HttpUtils();
//
//        try{
//
//            conn = httpUtils.getHttpURLConnection(url, "POST", token);
//            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
//            conn.setRequestProperty("Authorization", "Bearer " + token);
//            conn.setDoInput(true); // post 요청 보낼 때 있어야 함
//
//            // body string
//            String str = "{\n" +
//                    "\"taskId\": \"" + request.getTaskId() + "\",\n" +
//                    "\"AudioId\": \"" + request.getAudioId() + "\",\n" +
//                    "\"musicIndex\": \"" + request.getMusicIndex() + "\",\n" +
//                    "}";
//
//            // 1. 먼저 write 해야 함!
//            try (DataOutputStream dataOutputStream = new DataOutputStream(conn.getOutputStream())) {
//                dataOutputStream.write(str.getBytes(StandardCharsets.UTF_8)); // 한글 깨짐 방지 utf-8 붙임
//                dataOutputStream.flush();
//            }
//
//        } finally{
//            if(conn!=null) conn.disconnect();
//        }
//
//        return "";
//    }
}

