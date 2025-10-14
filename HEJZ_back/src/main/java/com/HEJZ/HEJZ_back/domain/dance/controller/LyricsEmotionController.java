package com.HEJZ.HEJZ_back.domain.dance.controller;

import com.HEJZ.HEJZ_back.domain.dance.dto.IntegratedRecommendationResponse;
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
import java.util.Map;

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
            summary = "통합 안무 추천 (4가지 로직)",
            description = "1.선택 감정, 2.선택 장르, 3,4.가사 분석 기반으로 안무를 추천합니다. 각 로직마다 최고 점수 안무 1개씩 추천합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "통합 안무 추천 성공",
                    content = @Content(schema = @Schema(implementation = IntegratedRecommendationResponse.class))),
            @ApiResponse(responseCode = "400", description = "잘못된 요청 (가사, 감정, 장르 누락 등)",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<IntegratedRecommendationResponse> analyzeLyrics(@RequestBody LyricsRequest request) {

        if (request.getLyrics() == null || request.getLyrics().isBlank()) {
            throw new CustomException(ErrorCode.EMPTY_LYRICS);
        }
        if (request.getSelectedEmotion() == null || request.getSelectedEmotion().isBlank()) {
            throw new CustomException(ErrorCode.INVALID_LYRICS_FORMAT);
        }
        if (request.getSelectedGenre() == null || request.getSelectedGenre().isBlank()) {
            throw new CustomException(ErrorCode.INVALID_LYRICS_FORMAT);
        }

        // 1. 선택 감정 기반 추천 (로직 1)
        EmotionEnum selectedEmotion = EmotionEnum.fromString(request.getSelectedEmotion());
        List<String> emotionMotions = motionRecommenderService.recommendTopMotionsByEmotion(selectedEmotion, 1);

        RecommendationResult selectedEmotionResult = new RecommendationResult(
                "선택 감정 기반 추천: " + request.getSelectedEmotion(),
                selectedEmotion,
                emotionMotions
        );

        // 2. 안무 장르 기반 추천 (로직 2)
        String selectedGenre = request.getSelectedGenre();
        List<String> genreMotions = motionRecommenderService.recommendTopMotionsByGenre(selectedGenre, 1);

        Map<String, List<String>> genreMapping = MotionRecommenderService.getGenreEmotionMapping();
        String representativeEmotionName = genreMapping.getOrDefault(selectedGenre, List.of(selectedEmotion.name())).get(0);
        EmotionEnum representativeEmotion = EmotionEnum.fromString(representativeEmotionName);

        RecommendationResult genreResult = new RecommendationResult(
                "선택 장르 기반 추천: " + selectedGenre,
                representativeEmotion,
                genreMotions
        );

        // 3 & 4. 가사 분석 기반 추천 (로직 3, 4)
        List<RecommendationResult> lyricsAnalysisResults = new ArrayList<>();
        String[] lines = request.getLyrics().split("\\r?\\n");

        int lineCount = lines.length;

        for (int i = 0; i < lineCount; i += 2) {
            String chunk;
            boolean isLastLine = (i + 1 >= lineCount);

            if (isLastLine) {
                // 마지막 1줄 처리
                chunk = lines[i];
            } else {
                // 2줄 청크 처리
                chunk = lines[i] + "\n" + lines[i + 1];
            }

            if (chunk.trim().isEmpty()) continue;

            EmotionEnum emotion = emotionAnalyzerService.analyzeEmotion(chunk);
            List<String> motions = motionRecommenderService.recommendTopMotionsByEmotion(emotion, 1);

            EmotionResult result = EmotionResult.builder()
                    .lyrics(chunk)
                    .emotion(emotion)
                    .motionIds(motions)
                    .build();
            emotionResultService.save(result);

            lyricsAnalysisResults.add(new RecommendationResult(chunk, emotion, motions));

            if (isLastLine) break;
        }

        // 5. 통합 응답 반환
        IntegratedRecommendationResponse response = new IntegratedRecommendationResponse(
                selectedEmotionResult,
                genreResult,
                lyricsAnalysisResults
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/selection/bulk")
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