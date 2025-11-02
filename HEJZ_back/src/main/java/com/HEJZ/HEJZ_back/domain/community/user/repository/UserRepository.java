package com.HEJZ.HEJZ_back.domain.community.user.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.HEJZ.HEJZ_back.domain.community.user.entity.UserEntity;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {

    @Query("select u.id from UserEntity u where u.username = :username")
    Long findIdByUsername(@Param("username") String username);

    public Optional<UserEntity> findById(Long id);

    public UserEntity findByUsername(String username);

}
