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
    public ResponseEntity<Map<String, Object>> getMotionUrl(@PathVariable String motionId) {
        return ResponseEntity.ok(s3DanceVideoService.getPresignedUrlForMotion(motionId));
    }
}
