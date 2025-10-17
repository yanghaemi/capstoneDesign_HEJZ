package com.HEJZ.HEJZ_back.domain.dance.controller;

import com.HEJZ.HEJZ_back.domain.dance.service.S3DanceVideoService;
import com.HEJZ.HEJZ_back.global.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Motion", description = "안무 영상 URL 조회 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/motion")
public class MotionController {

    private final S3DanceVideoService s3DanceVideoService;

    @GetMapping("/{motionId}")
    @Operation(
            summary = "특정 안무 영상 URL 조회",
            description = "motionId에 해당하는 SMPL 렌더링 영상의 Presigned URL을 반환합니다. URL은 10분간 유효합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "영상 URL 조회 성공",
                    content = @Content(schema = @Schema(implementation = String.class))),
            @ApiResponse(responseCode = "404", description = "영상을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<String> getMotionUrl(
            @Parameter(description = "조회할 안무의 motionId", example = "gBR_sBM_cAll_d04_mBR0_ch01")
            @PathVariable String motionId
    ) {
        String url = s3DanceVideoService.getPresignedUrl(motionId);
        return ResponseEntity.ok(url);
    }
}