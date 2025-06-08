package com.HEJZ.HEJZ_back.domain.dance.controller;

import com.HEJZ.HEJZ_back.domain.dance.dto.LyricsRequest;
import com.HEJZ.HEJZ_back.domain.dance.dto.RecommendationResult;
import com.HEJZ.HEJZ_back.domain.dance.dto.SelectionGroupDto;
import com.HEJZ.HEJZ_back.domain.dance.dto.SelectionGroupResponseDto;
import com.HEJZ.HEJZ_back.domain.dance.model.EmotionEnum;
import com.HEJZ.HEJZ_back.domain.dance.model.EmotionResult;
import com.HEJZ.HEJZ_back.domain.dance.service.EmotionAnalyzerService;
import com.HEJZ.HEJZ_back.domain.dance.service.EmotionResultService;
import com.HEJZ.HEJZ_back.domain.dance.service.EmotionSelectionService;
import com.HEJZ.HEJZ_back.domain.dance.service.MotionRecommenderService;
import com.HEJZ.HEJZ_back.global.exception.CustomException;
import com.HEJZ.HEJZ_back.global.exception.ErrorCode;
import com.HEJZ.HEJZ_back.global.exception.ErrorResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Emotion", description = "가사 감정 분석 및 안무 추천 관련 API")
@RestController
@RequestMapping("/api/emotion")
@RequiredArgsConstructor
public class LyricsEmotionController {

    private final EmotionAnalyzerService emotionAnalyzerService;
    private final MotionRecommenderService motionRecommenderService;
    private final EmotionResultService emotionResultService;
    private final EmotionSelectionService emotionSelectionService;

    @PostMapping("/analyze")
    @Operation(
            summary = "가사 감정 분석 및 안무 추천",
            description = "2줄씩 끊은 가사에 대해 감정을 분석하고, 감정에 맞는 안무 motionId 4개를 추천합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "감정 분석 및 안무 추천 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 (가사 누락, 형식 오류 등)",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<RecommendationResult>> analyzeLyrics(@RequestBody LyricsRequest request) {
        if (request.getLyrics() == null || request.getLyrics().isBlank()) {
            throw new CustomException(ErrorCode.EMPTY_LYRICS);
        }

        String[] lines = request.getLyrics().split("\\r?\\n");
        if (lines.length < 2) {
            throw new CustomException(ErrorCode.INVALID_LYRICS_FORMAT);
        }

        List<RecommendationResult> results = new ArrayList<>();

        for (int i = 0; i < lines.length - 1; i += 2) {
            String chunk = lines[i] + "\n" + lines[i + 1];

            EmotionEnum emotion = emotionAnalyzerService.analyzeEmotion(chunk);
            List<String> motions = motionRecommenderService.recommendTopMotionsByEmotion(emotion, 4);

            EmotionResult result = EmotionResult.builder()
                    .lyrics(chunk)
                    .emotion(emotion)
                    .motionIds(motions)
                    .build();
            emotionResultService.save(result);

            results.add(new RecommendationResult(chunk, emotion, motions));
        }

        if (lines.length % 2 == 1) {
            String lastLine = lines[lines.length - 1];

            EmotionEnum emotion = emotionAnalyzerService.analyzeEmotion(lastLine);
            List<String> motions = motionRecommenderService.recommendTopMotionsByEmotion(emotion, 4);

            EmotionResult result = EmotionResult.builder()
                    .lyrics(lastLine)
                    .emotion(emotion)
                    .motionIds(motions)
                    .build();
            emotionResultService.save(result);

            results.add(new RecommendationResult(lastLine, emotion, motions));
        }

        return ResponseEntity.ok(results);
    }

    @PostMapping("/selection/bulk")
    @Operation(
            summary = "안무 선택 저장",
            description = "사용자가 선택한 감정-안무 쌍을 bulk로 저장합니다."
    )
    public ResponseEntity<?> saveEmotionSelections(@RequestBody List<SelectionGroupDto> request) {
        emotionSelectionService.saveSelections(request);
        return ResponseEntity.ok("선택한 안무가 저장되었습니다.");
    }

    @GetMapping("/selection")
    public ResponseEntity<List<SelectionGroupResponseDto>> getAllEmotionSelections() {
        List<SelectionGroupResponseDto> results = emotionSelectionService.getAllSelections();
        return ResponseEntity.ok(results);
    }
}
