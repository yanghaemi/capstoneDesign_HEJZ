package com.HEJZ.HEJZ_back.domain.community.file.controller;

import com.HEJZ.HEJZ_back.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    // 절대 경로로 변경
    private static final String UPLOAD_DIR = System.getProperty("user.home") + "/uploads";

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Object>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            // 파일 확장자 추출
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || !originalFilename.contains(".")) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(400, null, "유효하지 않은 파일입니다."));
            }

            String ext = originalFilename.substring(originalFilename.lastIndexOf("."));
            String fileName = UUID.randomUUID() + ext;

            // 디렉토리 생성 (존재하지 않으면)
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 파일 저장
            Path filePath = uploadPath.resolve(fileName);
            file.transferTo(filePath.toFile());

            String url = "/static/" + fileName;

            return ResponseEntity.ok(new ApiResponse<>(200, Map.of("url", url), "파일 업로드 성공"));

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>(500, null, "업로드 실패: " + e.getMessage()));
        }
    }
}