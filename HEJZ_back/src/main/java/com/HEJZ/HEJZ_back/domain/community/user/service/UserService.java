package com.HEJZ.HEJZ_back.domain.community.user.service;

import java.time.LocalDateTime;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.HEJZ.HEJZ_back.domain.community.user.dto.SignUpRequest;
import com.HEJZ.HEJZ_back.domain.community.user.entity.UserEntity;
import com.HEJZ.HEJZ_back.domain.community.user.repository.UserRepository;
import com.HEJZ.HEJZ_back.global.response.ApiResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {
    // 유저 관련 비즈니스 로직

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    public String signUp(SignUpRequest signUpRequest) {
        // 회원가입 로직 구현
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

    public ApiResponse<Object> login(String username, String password) {
        // 로그인 로직 구현
        // method: post

        UserEntity user = searchUserName(username);

        if (user == null) {
            return new ApiResponse<Object>(400, null, "존재하지 않는 아이디입니다.");
        }

        String storedHashedPassword = user.getPasswordHash();

        if (passwordEncoder.matches(password, storedHashedPassword)) {
            System.out.println("비밀번호 일치");
        } else {
            return new ApiResponse<Object>(400, null, "비밀번호가 틀렸습니다.");
        }

        return new ApiResponse<Object>(200, null, "로그인 성공!");
    }

    private UserEntity searchUserName(String username) {
        // DB에서 username으로 유저 검색
        UserEntity user = userRepository.findByUsername(username);
        if (user != null) {
            System.out.println("유저 찾음: " + user.getUsername());
            return user;
        } else {
            System.out.println("유저 없음: " + username);
            return null;
        }
    }
}
