package com.HEJZ.HEJZ_back.domain.dance.controller;

import com.HEJZ.HEJZ_back.domain.dance.dto.IntegratedRecommendationResponse;
import com.HEJZ.HEJZ_back.domain.dance.dto.LyricsGroupRecommendation;
import com.HEJZ.HEJZ_back.domain.dance.dto.LyricsRequest;
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
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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
            description = "각 가사 덩어리마다 4가지 로직으로 안무를 추천합니다. 같은 덩어리 내에서는 중복 없이 4개의 다른 안무를 추천합니다."
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

        EmotionEnum selectedEmotion = EmotionEnum.fromString(request.getSelectedEmotion());
        String selectedGenre = request.getSelectedGenre();

        List<LyricsGroupRecommendation> recommendations = new ArrayList<>();
        String[] lines = request.getLyrics().split("\\r?\\n");
        int lineCount = lines.length;

        for (int i = 0; i < lineCount; i += 2) {
            String chunk;
            boolean isLastLine = (i + 1 >= lineCount);

            if (isLastLine) {
                chunk = lines[i];
            } else {
                chunk = lines[i] + "\n" + lines[i + 1];
            }

            if (chunk.trim().isEmpty()) continue;

            // 각 가사 덩어리마다 중복 방지를 위한 Set
            Set<String> usedMotions = new HashSet<>();

            // 로직 1: 선택 감정 기반 추천
            List<String> emotionMotions = motionRecommenderService.recommendTopMotionsByEmotionExcluding(
                    selectedEmotion, 1, usedMotions);
            String selectedEmotionMotion = emotionMotions.isEmpty() ? null : emotionMotions.get(0);
            if (selectedEmotionMotion != null) {
                usedMotions.add(selectedEmotionMotion);
            }

            // 로직 2: 장르 기반 추천
            List<String> genreMotions = motionRecommenderService.recommendTopMotionsByGenreExcluding(
                    selectedGenre, 1, usedMotions);
            String selectedGenreMotion = genreMotions.isEmpty() ? null : genreMotions.get(0);
            if (selectedGenreMotion != null) {
                usedMotions.add(selectedGenreMotion);
            }

            // 로직 3, 4: 가사 분석 감정 기반 추천 (2개)
            EmotionEnum analyzedEmotion = emotionAnalyzerService.analyzeEmotion(chunk);
            List<String> analyzedMotions = motionRecommenderService.recommendTopMotionsByEmotionExcluding(
                    analyzedEmotion, 2, usedMotions);

            String analyzedMotion1 = analyzedMotions.size() > 0 ? analyzedMotions.get(0) : null;
            String analyzedMotion2 = analyzedMotions.size() > 1 ? analyzedMotions.get(1) : null;

            // DB 저장용
            List<String> allMotions = new ArrayList<>();
            if (selectedEmotionMotion != null) allMotions.add(selectedEmotionMotion);
            if (selectedGenreMotion != null) allMotions.add(selectedGenreMotion);
            if (analyzedMotion1 != null) allMotions.add(analyzedMotion1);
            if (analyzedMotion2 != null) allMotions.add(analyzedMotion2);

            EmotionResult result = EmotionResult.builder()
                    .lyrics(chunk)
                    .emotion(analyzedEmotion)
                    .motionIds(allMotions)
                    .build();
            emotionResultService.save(result);

            // 응답 DTO 생성
            LyricsGroupRecommendation recommendation = new LyricsGroupRecommendation(
                    chunk,
                    analyzedEmotion,
                    selectedEmotionMotion,
                    selectedGenreMotion,
                    analyzedMotion1,
                    analyzedMotion2
            );
            recommendations.add(recommendation);

            if (isLastLine) break;
        }

        IntegratedRecommendationResponse response = new IntegratedRecommendationResponse(recommendations);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/selection/bulk")
    @Operation(
            summary = "가사 그룹별 선택 안무 저장",
            description = "가사 덩어리별로 사용자가 선택한 안무 목록을 DB에 저장합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "안무 선택 저장 성공"),
            @ApiResponse(responseCode = "400", description = "잘못된 요청",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<?> saveEmotionSelections(@RequestBody List<SelectionGroupDto> request) {
        emotionSelectionService.saveSelections(request);
        return ResponseEntity.ok("선택한 안무가 저장되었습니다.");
    }

    @GetMapping("/selection")
    @Operation(
            summary = "저장된 안무 선택 조회",
            description = "가사 그룹별로 저장된 선택 안무 목록과 영상 URL을 조회합니다."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "조회 성공",
                    content = @Content(array = @ArraySchema(schema = @Schema(implementation = SelectionGroupResponseDto.class)))),
            @ApiResponse(responseCode = "500", description = "서버 내부 오류",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
    })
    public ResponseEntity<List<SelectionGroupResponseDto>> getAllEmotionSelections() {
        List<SelectionGroupResponseDto> results = emotionSelectionService.getAllSelections();
        return ResponseEntity.ok(results);
    }
}