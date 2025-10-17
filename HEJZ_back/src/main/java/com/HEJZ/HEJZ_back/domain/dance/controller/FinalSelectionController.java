package com.HEJZ.HEJZ_back.domain.dance.controller;

import com.HEJZ.HEJZ_back.domain.dance.service.FinalSelectionService;
import com.HEJZ.HEJZ_back.domain.dance.service.S3DanceVideoService;
import com.HEJZ.HEJZ_back.global.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Tag(name = "Final Selection", description = "최종 선택 안무 관련 API")
@RestController
@RequestMapping("/api/emotion/selections")
@RequiredArgsConstructor
public class FinalSelectionController {

    private final S3DanceVideoService s3DanceVideoService;
    private final FinalSelectionService finalSelectionService;

    @PostMapping
    @Operation(
            summary = "안무 영상 URL 조회",
            description = "선택한 motionId 목록에 대한 Presigned URL을 반환합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "영상 URL 조회 성공",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = String.class)))),
            @ApiResponse(responseCode = "404", description = "영상을 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<String>> getPresignedUrls(@RequestBody List<String> motionIds) {
        List<String> urls = s3DanceVideoService.getPresignedUrls(motionIds);
        return ResponseEntity.ok(urls);
    }

    @PostMapping("/save")
    @Operation(
            summary = "최종 선택 안무 저장",
            description = "사용자가 최종 선택한 안무 motionId 목록을 DB에 저장합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "안무 저장 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<Map<String, String>> saveFinalSelections(@RequestBody List<String> motionIds) {
        finalSelectionService.save(motionIds);
        return ResponseEntity.ok(Map.of("message", "최종 선택한 안무가 저장되었습니다."));
    }
}