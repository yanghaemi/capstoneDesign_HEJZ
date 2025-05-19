package com.HEJZ.HEJZ_back.service;

import com.HEJZ.HEJZ_back.dto.SunoRequest;
import com.HEJZ.HEJZ_back.util.HttpUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.DataOutputStream;
import java.io.IOException;
import java.net.HttpURLConnection;

@Service
public class SunoService {

    @Value("${suno.token}")
    private String token;
    public String requestToSuno(SunoRequest request){
        // Suno API로 HTTP 요청 보내는 코드
        String url = "https://apibox.erweima.ai/api/v1/generate";
        HttpURLConnection conn = null;

        HttpUtils httpUtils = new HttpUtils();

        try{

            conn = httpUtils.getHttpURLConnection(url, "POST", token);
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            conn.setDoInput(true); // post 요청 보낼 때 있어야 함


            String str = "{\n" +
                    "\"prompt\": \"" + request.getPrompt() + "\",\n" +
                    "\"style\": \"" + request.getStyle() + "\",\n" +
                    "\"title\": \"" + request.getTitle() + "\",\n" +
                    "\"customMode\": false,\n" +
                    "\"instrumental\": false,\n" +
                    "\"model\": \"" + request.getModel() + "\",\n" +
                    "\"callBackUrl\": \"https://api.example.com/callback\"\n" +
                    "}";



            // 1. 먼저 write 해야 함!
            try (DataOutputStream dataOutputStream = new DataOutputStream(conn.getOutputStream())) {
                dataOutputStream.writeBytes(str);
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
}

