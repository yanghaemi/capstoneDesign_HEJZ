package com.HEJZ.HEJZ_back.domain.community.file.controller;

import com.HEJZ.HEJZ_back.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Profile({"local","dev"})
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    // 절대 경로
    private static final String UPLOAD_DIR = System.getProperty("user.home") + "/uploads";

    // 허용 확장자 (필요시 추가)
    private static final Set<String> ALLOWED_EXT = Set.of(
            ".jpg", ".jpeg", ".png", ".gif", ".webp",
            ".mp4", ".mov", ".m4v", ".webm"
    );

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Object>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || !originalFilename.contains(".")) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(400, null, "유효하지 않은 파일입니다."));
            }

            // 확장자 확인 (화이트리스트)
            String ext = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
            if (!ALLOWED_EXT.contains(ext)) {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(400, null, "허용되지 않는 파일 형식입니다."));
            }

            String fileName = UUID.randomUUID() + ext;

            // 디렉토리 생성
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 파일 저장
            Path filePath = uploadPath.resolve(fileName);
            file.transferTo(filePath.toFile());

            // MIME 탐지 (우선순위: 파일시스템 → 업로드 헤더 → 확장자 매핑)
            String mime = Files.probeContentType(filePath);
            if (mime == null || mime.isBlank()) {
                mime = file.getContentType();
            }
            if (mime == null || mime.isBlank()) {
                mime = guessMimeFromExt(ext);
            }

            String url = "/static/" + fileName;

            return ResponseEntity.ok(
                    new ApiResponse<>(200, Map.of("url", url, "mimeType", mime), "파일 업로드 성공")
            );

        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500)
                    .body(new ApiResponse<>(500, null, "업로드 실패: " + e.getMessage()));
        }
    }

    // 확장자 기반 간단 MIME 보정
    private String guessMimeFromExt(String ext) {
        switch (ext) {
            case ".jpg":
            case ".jpeg": return "image/jpeg";
            case ".png":  return "image/png";
            case ".gif":  return "image/gif";
            case ".webp": return "image/webp";
            case ".mp4":  return "video/mp4";
            case ".mov":  return "video/quicktime";
            case ".m4v":  return "video/x-m4v";
            case ".webm": return "video/webm";
            default:      return "application/octet-stream";
        }
    }
}
