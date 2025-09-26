package com.HEJZ.HEJZ_back.domain.community.user.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.HEJZ.HEJZ_back.domain.community.user.dto.LoginRequest;
import com.HEJZ.HEJZ_back.domain.community.user.dto.SignUpRequest;
import com.HEJZ.HEJZ_back.domain.community.user.service.UserService;
import com.HEJZ.HEJZ_back.global.response.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/user")
public class UserController {

    private final UserService userService;

    /*
     * 호출 url : http://localhost:8080/api/user/signup
     * 설명 : 회원가입 api
     * method : post
     */
    @PostMapping("/signup")
    public ResponseEntity<String> signUp(@RequestBody SignUpRequest request) {
        String result = userService.signUp(request);

        System.out.println("회원가입: " + result);

        return ResponseEntity.ok(result);
    }

    /*
     * 호출 url : http://localhost:8080/api/user/login
     * 설명 : 로그인 api
     * method : post
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Object>> login(@RequestBody LoginRequest loginRequest) {
        // 로그인 로직 구현
        // 예: 유저 인증, 토큰 발급 등
        // method: post
        // TODO: 로그인 로직 구현
        System.out.println("로그인 시도: " + loginRequest.getUsername());

        // 임시 응답
        ApiResponse<Object> apiRequest = new ApiResponse<>(200, null, "login successful!");
        return ResponseEntity.ok(apiRequest);
    }
}
