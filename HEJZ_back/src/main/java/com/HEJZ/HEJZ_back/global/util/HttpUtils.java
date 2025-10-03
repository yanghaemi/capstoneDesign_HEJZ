package com.HEJZ.HEJZ_back.global.util;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class HttpUtils {
    // Suno API용 HTTP 연결 세팅
    public HttpURLConnection getHttpURLConnection(String urlString, String method, String token) {
        try {
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();

            conn.setRequestMethod(method);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            conn.setDoOutput(true);
            return conn;
        } catch (Exception e) {
            throw new RuntimeException("HTTP 연결 설정 실패", e);
        }
    }

    // 응답 파싱 함수
    public String getHttpResponse(HttpURLConnection conn) {
        try {
            int responseCode = conn.getResponseCode();
            BufferedReader br;

            if (responseCode >= 200 && responseCode < 300) {
                // 정상 응답
                br = new BufferedReader(new InputStreamReader(conn.getInputStream(), "UTF-8"));
            } else {
                // 에러 응답 (500, 400 등)
                br = new BufferedReader(new InputStreamReader(conn.getErrorStream(), "UTF-8"));
                System.err.println("❗ 서버 응답 코드: " + responseCode);
            }

            StringBuilder response = new StringBuilder();
            String line;

            while ((line = br.readLine()) != null) {
                response.append(line);
            }

            br.close();
            return response.toString();

        } catch (Exception e) {
            throw new RuntimeException("HTTP 응답 읽기 실패", e);
        }
    }
}