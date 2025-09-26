package com.HEJZ.HEJZ_back.domain.community.user.service;

import java.time.LocalDateTime;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.HEJZ.HEJZ_back.domain.community.user.dto.SignUpRequest;
import com.HEJZ.HEJZ_back.domain.community.user.entity.UserEntity;
import com.HEJZ.HEJZ_back.domain.community.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {
    // 유저 관련 비즈니스 로직

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    public String signUp(SignUpRequest signUpRequest) {
        // 회원가입 로직 구현
        // 예: 유저 정보 저장, 중복 체크 등
        // method: post

        String plainPassword = signUpRequest.getPassword(); // 원본 비밀번호
        String hashedPassword = passwordEncoder.encode(plainPassword); // bcrypt 해싱

        System.out.println("원본 비밀번호: " + plainPassword);
        System.out.println("해싱된 비밀번호: " + hashedPassword);

        UserEntity newUser = new UserEntity();
        newUser.setUsername(signUpRequest.getUsername());
        newUser.setPasswordHash(hashedPassword);
        newUser.setEmail(signUpRequest.getEmail());
        newUser.setNickname(signUpRequest.getNickname());
        newUser.setProfileImageUrl(signUpRequest.getProfileImageUrl());
        newUser.setCreatedAt(LocalDateTime.now());

        userRepository.save(newUser);

        return signUpRequest.getUsername() + " 회원가입 성공!";
    }
}
