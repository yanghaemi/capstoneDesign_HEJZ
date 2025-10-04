package com.HEJZ.HEJZ_back.domain.community.follow.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.HEJZ.HEJZ_back.domain.community.follow.dto.FollowRequest;
import com.HEJZ.HEJZ_back.domain.community.follow.service.FollowService;
import com.HEJZ.HEJZ_back.global.response.ApiResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("api/follow")
public class FollowController {
    // 팔로우 관계 컨트롤러

    private final FollowService followService;

    /*
     * 호출 url : http://localhost:8080/api/follow/follow
     * 설명 : 유저 팔로우 api
     * method : post
     */
    @PostMapping("/follow")
    public ResponseEntity<ApiResponse<Object>> followUser(@RequestBody FollowRequest followRequest) {

        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();
        String myUsername = authentication.getName(); // jwt 토큰으로 내 아이디 받기

        String followedUsername = followRequest.getUsername();

        ApiResponse<Object> result = followService.followUser(myUsername, followedUsername);

        return ResponseEntity.ok(result);
    }

    /*
     * 호출 url : http://localhost:8080/api/follow/unfollow
     * 설명 : 유저 언팔로우 api
     * method : post
     */
    @PostMapping("/unfollow")
    public ResponseEntity<ApiResponse<Object>> unfollowUser(@RequestBody FollowRequest unfollowRequest) {

        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();
        String myUsername = authentication.getName(); // jwt 토큰으로 내 아이디 받기

        String unfollowedUsername = unfollowRequest.getUsername();

        ApiResponse<Object> result = followService.unfollowUser(myUsername, unfollowedUsername);

        return ResponseEntity.ok(result);
    }

    /*
     * 호출 url : http://localhost:8080/api/follow/getFollowers
     * 설명 : 나의 팔로워 목록 조회 api
     * method : get
     */
    @GetMapping("/getFollowers")
    public ResponseEntity<ApiResponse<Object>> getFollowers() {
        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();
        String myUsername = authentication.getName(); // jwt 토큰으로 내 아이디 받기

        ApiResponse<Object> result = followService.getFollowers(myUsername);

        return ResponseEntity.ok(result);
    }

    /*
     * 호출 url : http://localhost:8080/api/follow/getFollowings
     * 설명 : 나의 팔로잉 목록 조회 api
     * method : get
     */
    @GetMapping("/getFollowings")
    public ResponseEntity<ApiResponse<Object>> getFollowings() {
        Authentication authentication = SecurityContextHolder.getContext()
                .getAuthentication();
        String myUsername = authentication.getName(); // jwt 토큰으로 내 아이디 받기

        ApiResponse<Object> result = followService.getFollowings(myUsername);

        return ResponseEntity.ok(result);
    }

    /*
     * 호출 url : http://localhost:8080/api/follow/interfollow
     * 설명: 맞팔 여부 획인
     * method : post
     */
    @PostMapping("/interfollow")
    public ResponseEntity<ApiResponse<Object>> isInterFollow(@RequestBody FollowRequest targetUsername) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String myUsername = authentication.getName();

        ApiResponse<Object> result = followService.isInterFollow(myUsername, targetUsername.getUsername());

        return ResponseEntity.ok(result);
    }
}
