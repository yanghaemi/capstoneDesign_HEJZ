package com.HEJZ.HEJZ_back.domain.dance.repository;

import com.HEJZ.HEJZ_back.domain.dance.model.LyricsSelectionGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LyricsSelectionGroupRepository extends JpaRepository<LyricsSelectionGroup, Long> {
    @Query("SELECT g FROM LyricsSelectionGroup g JOIN FETCH g.motions")
    List<LyricsSelectionGroup> findAllWithMotions();
}
