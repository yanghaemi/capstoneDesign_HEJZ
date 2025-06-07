package com.HEJZ.HEJZ_back.domain.music.repository;

import com.HEJZ.HEJZ_back.domain.music.entity.Song;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface SongRepository extends JpaRepository<Song, String>
{
//    @Query("SELECT ")
    Optional<Song> findByTaskId(String taskId);
}
