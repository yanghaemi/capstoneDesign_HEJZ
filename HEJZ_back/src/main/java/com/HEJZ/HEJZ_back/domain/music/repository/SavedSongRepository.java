package com.HEJZ.HEJZ_back.domain.music.repository;

import com.HEJZ.HEJZ_back.domain.music.entity.SavedSong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedSongRepository extends JpaRepository<SavedSong, Long> {
    List<SavedSong> findTop5ByOrderByCreatedAtDesc();

    Optional<SavedSong> findByTaskId(String taskId);
}
