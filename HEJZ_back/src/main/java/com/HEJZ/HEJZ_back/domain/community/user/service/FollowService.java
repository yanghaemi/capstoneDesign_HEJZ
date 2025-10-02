package com.HEJZ.HEJZ_back.domain.community.user.service;

import org.springframework.stereotype.Service;

import com.HEJZ.HEJZ_back.domain.community.user.dto.UserDto;
import com.HEJZ.HEJZ_back.domain.community.user.entity.UserEntity;
import com.HEJZ.HEJZ_back.domain.community.user.repository.UserRepository;
import com.HEJZ.HEJZ_back.global.response.ApiResponse;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;

/*
 * 팔로우 기능 개발
 */

@Service
@AllArgsConstructor
public class FollowService {

    private final UserRepository userRepository;

    @Transactional
    public ApiResponse<Object> followUser(String myUsername, String followedUsername) {
        try {

            UserEntity followedUser = userRepository.findByUsername(followedUsername);

            System.out.println("팔로우 시도: " + myUsername + " -> " + followedUsername);

            if (followedUser == null) {
                return new ApiResponse<Object>(404, null, "팔로우하려는 유저를 찾을 수 없습니다.");
            }

            if (followedUsername.equals(myUsername)) {
                return new ApiResponse<Object>(400, null, "자기 자신은 팔로우할 수 없습니다.");
            }

            int followerCount = userRepository.plusFollower(followedUsername);
            int followingCount = userRepository.plusFollowing(myUsername);

            System.out.println("팔로워 수: " + followerCount);
            System.out.println("팔로잉 수: " + followingCount);

            // TODO: FollowEntity에 팔로우 관계 저장

            return new ApiResponse<Object>(200, null, "팔로우 성공");
        } catch (Exception e) {
            return new ApiResponse<Object>(500, null, "팔로우 실패: " + e.getMessage());
        }
    }

    @Transactional
    public ApiResponse<Object> unfollowUser(String myUsername, String unfollowedUsername) {
        try {
            UserEntity followedUser = userRepository.findByUsername(unfollowedUsername);

            if (followedUser == null) {
                return new ApiResponse<Object>(404, null, "언팔로우하려는 유저를 찾을 수 없습니다.");
            }

            if (unfollowedUsername.equals(myUsername)) {
                return new ApiResponse<Object>(400, null, "자기 자신은 언팔로우할 수 없습니다.");
            }

            int followerCount = userRepository.minusFollower(unfollowedUsername);
            int followingCount = userRepository.minusFollowing(myUsername);

            System.out.println("팔로워 수: " + followerCount);
            System.out.println("팔로잉 수: " + followingCount);

            return new ApiResponse<Object>(200, followerCount, "언팔로우 성공");
        } catch (Exception e) {
            return new ApiResponse<Object>(500, null, "언팔로우 실패: " + e.getMessage());
        }
    }
}
