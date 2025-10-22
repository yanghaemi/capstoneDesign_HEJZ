package com.HEJZ.HEJZ_back.domain.community.user.controller;

import org.springframework.data.repository.query.Param;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.HEJZ.HEJZ_back.domain.community.user.dto.InfoRequest;
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
    public ResponseEntity<ApiResponse<Object>> signUp(@RequestBody SignUpRequest request) {
        ApiResponse<Object> result = userService.signUp(request);

        System.out.println("회원가입: " + result.getMsg());

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
        System.out.println("로그인 시도: " + loginRequest.getUsername());

        ApiResponse<Object> result = userService.login(loginRequest.getUsername(), loginRequest.getPassword());
        System.out.println("로그인 결과: " + result.getMsg());
        System.out.println("로그인 데이터: " + result.getData());

        return ResponseEntity.ok(result);
    }

    /*
     * 호출 url : http://localhost:8080/api/user/myinfo
     * 설명 : 내 정보 조회 api
     * method : get
     */
    @GetMapping("/myinfo")
    public ResponseEntity<ApiResponse<Object>> getMyInfo() {

        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();
        String username = authentication.getName();
        ApiResponse<Object> result = userService.getInfo(username);

        return ResponseEntity.ok(result);
    }

    /*
     * 호출 url : http://localhost:8080/api/user/info
     * 설명 : 유저 정보 조회 api
     * method : post
     */
    @PostMapping("/info")
    public ResponseEntity<ApiResponse<Object>> getInfo(@RequestBody InfoRequest req) {

        System.out.println(req.getUsername() + "님의 정보를 조회합니다.");
        ApiResponse<Object> result = userService.getInfo(req.getUsername());

        return ResponseEntity.ok(result);
    }

}
