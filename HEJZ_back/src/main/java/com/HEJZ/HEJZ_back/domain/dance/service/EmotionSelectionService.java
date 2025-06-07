package com.HEJZ.HEJZ_back.domain.dance.service;

import com.HEJZ.HEJZ_back.domain.dance.dto.MotionVideoDto;
import com.HEJZ.HEJZ_back.domain.dance.dto.SelectionGroupDto;
import com.HEJZ.HEJZ_back.domain.dance.dto.SelectionGroupResponseDto;
import com.HEJZ.HEJZ_back.domain.dance.model.LyricsSelectionGroup;
import com.HEJZ.HEJZ_back.domain.dance.model.SelectedMotion;
import com.HEJZ.HEJZ_back.domain.dance.repository.LyricsSelectionGroupRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.S3Client;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmotionSelectionService {

    private final LyricsSelectionGroupRepository selectionGroupRepository;
    private final S3DanceVideoService s3DanceVideoService;

    @Transactional
    public void saveSelections(List<SelectionGroupDto> requests) {
        for (SelectionGroupDto dto : requests) {
            LyricsSelectionGroup group = new LyricsSelectionGroup();
            group.setLyricsGroup(dto.getLyricsGroup());

            List<SelectedMotion> motions = dto.getSelectedMotionIds().stream()
                    .map(motionId -> {
                        SelectedMotion motion = new SelectedMotion();
                        motion.setMotionId(motionId);
                        motion.setSelectionGroup(group);
                        return motion;
                    }).toList();

            group.setMotions(motions);
            selectionGroupRepository.save(group);
        }
    }

    @Transactional
    public List<SelectionGroupResponseDto> getAllSelections() {
        return selectionGroupRepository.findAllWithMotions().stream()
                .map(group -> new SelectionGroupResponseDto(
                        group.getLyricsGroup(),
                        group.getMotions().stream()
                                .map(motion -> new MotionVideoDto(
                                        motion.getMotionId(),
                                        s3DanceVideoService.getPresignedUrl(motion.getMotionId())
                                ))
                                .toList()
                ))
                .toList();
    }


}