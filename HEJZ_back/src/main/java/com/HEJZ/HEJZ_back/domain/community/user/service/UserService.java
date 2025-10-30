package com.HEJZ.HEJZ_back.domain.community.user.service;

import java.time.LocalDateTime;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.HEJZ.HEJZ_back.domain.community.user.dto.SignUpRequest;
import com.HEJZ.HEJZ_back.domain.community.user.dto.UserDto;
import com.HEJZ.HEJZ_back.domain.community.user.entity.UserEntity;
import com.HEJZ.HEJZ_back.domain.community.user.repository.UserRepository;
import com.HEJZ.HEJZ_back.global.jwt.JwtTokenProvider;
import com.HEJZ.HEJZ_back.global.response.ApiResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {
    // 유저 관련 비즈니스 로직

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    public ApiResponse<Object> signUp(SignUpRequest signUpRequest) {
        // 회원가입 로직 구현
        // method: post

        try {
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
            newUser.setBio(signUpRequest.getBio());
            newUser.setCreatedAt(LocalDateTime.now());

            userRepository.save(newUser);

            return new ApiResponse<Object>(200, newUser, signUpRequest.getUsername() + " 회원가입 성공!");
        } catch (Exception e) {
            return new ApiResponse<Object>(500, null, "회원가입 실패: " + e.getMessage());
        }
    }

    public ApiResponse<Object> login(String username, String password) {
        // 로그인 로직 구현
        // method: post

        try {
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

            String token = jwtTokenProvider.createToken(username);
            System.out.println("발급된 토큰: " + token);

            return new ApiResponse<Object>(200, token, "로그인 성공!");

        } catch (Exception e) {
            return new ApiResponse<Object>(500, null, "서버 오류: " + e.getMessage());
        }
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

    // 로그아웃은 프론트에서 토큰 삭제로 처리

    public ApiResponse<Object> getInfo(String username) {

        try {
            UserEntity user = userRepository.findByUsername(username);
            if (user == null) {
                return new ApiResponse<Object>(404, null, "유저를 찾을 수 없습니다.");
            }

            UserDto info = new UserDto();
            info.setUsername(user.getUsername());
            info.setEmail(user.getEmail());
            info.setNickname(user.getNickname());
            info.setProfileImageUrl(user.getProfileImageUrl());
            info.setBio(user.getBio());
            info.setCreatedAt(user.getCreatedAt());

            return new ApiResponse<Object>(200, info, "내 정보 조회 성공!");
        } catch (Exception e) {
            return new ApiResponse<Object>(500, null, "서버 오류: " + e.getMessage());
        }
    }
}
