package com.HEJZ.HEJZ_back.domain.dance.controller;

import com.HEJZ.HEJZ_back.domain.dance.service.FinalSelectionService;
import com.HEJZ.HEJZ_back.domain.dance.service.S3DanceVideoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/emotion/selections")
@RequiredArgsConstructor
public class FinalSelectionController {

    private final S3DanceVideoService s3DanceVideoService;
    private final FinalSelectionService finalSelectionService;

    @PostMapping
    public ResponseEntity<List<String>> getPresignedUrls(@RequestBody List<String> motionIds) {
        List<String> urls = s3DanceVideoService.getPresignedUrls(motionIds);
        return ResponseEntity.ok(urls);
    }

    @PostMapping("/save")
    public ResponseEntity<Map<String, String>> saveFinalSelections(@RequestBody List<String> motionIds) {
        finalSelectionService.save(motionIds);
        return ResponseEntity.ok(Map.of("message", "최종 선택한 안무가 저장되었습니다."));
    }
}
