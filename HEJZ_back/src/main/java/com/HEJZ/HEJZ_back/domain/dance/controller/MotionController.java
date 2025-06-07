package com.HEJZ.HEJZ_back.domain.dance.controller;

import com.HEJZ.HEJZ_back.domain.dance.service.S3DanceVideoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/motion")
public class MotionController {

    private final S3DanceVideoService s3DanceVideoService;

    @GetMapping("/{motionId}")
    public ResponseEntity<String> getMotionUrl(@PathVariable String motionId) {
        String url = s3DanceVideoService.getPresignedUrl(motionId);
        return ResponseEntity.ok(url);
    }
}
