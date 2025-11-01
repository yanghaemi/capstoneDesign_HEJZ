package com.HEJZ.HEJZ_back.domain.music.repository;

import com.HEJZ.HEJZ_back.domain.music.entity.SavedSong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedSongRepository extends JpaRepository<SavedSong, Long> {
    List<SavedSong> findTop20ByOrderByCreatedAtDesc();

    Optional<SavedSong> findByTaskIdAndAudioId(String taskId, String audioId);

    Optional<SavedSong> findByTaskId(String taskId);

    @Query("""
                select (count(s) > 0)
                from SavedSong s
                where s.taskId = :taskId
                  and s.audioId = :audioId
                  and (
                        (s.lyricsJson is not null and s.lyricsJson <> '')
                     or (s.plainLyrics is not null and s.plainLyrics <> '')
                     or (s.waveformJson is not null and s.waveformJson <> '')
                  )
            """)
    boolean existsTimestampPayload(@Param("taskId") String taskId, @Param("audioId") String audioId);
}
