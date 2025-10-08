package com.HEJZ.HEJZ_back.domain.dance.repository;

import com.HEJZ.HEJZ_back.domain.dance.model.FinalSelectedMotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FinalSelectedMotionRepository extends JpaRepository<FinalSelectedMotion, Long> {
}

