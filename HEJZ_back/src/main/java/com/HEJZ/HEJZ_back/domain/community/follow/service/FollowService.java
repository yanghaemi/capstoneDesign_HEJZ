package com.HEJZ.HEJZ_back.domain.community.follow.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.HEJZ.HEJZ_back.domain.community.follow.dto.FollowResponse;
import com.HEJZ.HEJZ_back.domain.community.follow.entity.FollowerEntity;
import com.HEJZ.HEJZ_back.domain.community.follow.entity.FollowingEntity;
import com.HEJZ.HEJZ_back.domain.community.follow.repository.FollowerRepository;
import com.HEJZ.HEJZ_back.domain.community.follow.repository.FollowingRepository;
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
    private final FollowerRepository followerRepository;
    private final FollowingRepository followingRepository;

    @Transactional
    public ApiResponse<Object> followUser(String myUsername, String followedUsername) {
        try {

            // 팔로우하려는 유저가 존재하는지 확인
            UserEntity followedUser = userRepository.findByUsername(followedUsername);

            System.out.println("팔로우 시도: " + myUsername + " -> " + followedUsername);

            if (followedUser == null) {
                return new ApiResponse<Object>(404, null, "팔로우하려는 유저를 찾을 수 없습니다.");
            }

            if (followedUsername.equals(myUsername)) {
                return new ApiResponse<Object>(400, null, "자기 자신은 팔로우할 수 없습니다.");
            }

            // DB에 팔로우 관계 저장
            // int followerCount = userRepository.plusFollower(followedUsername);
            // int followingCount = userRepository.plusFollowing(myUsername);

            // System.out.println("팔로워 수: " + followerCount);
            // System.out.println("팔로잉 수: " + followingCount);

            // 팔로워 관계 저장
            FollowerEntity followUserEntity = new FollowerEntity();
            followUserEntity.setUsername(myUsername);
            followUserEntity.setFollowed(followedUsername);

            followerRepository.save(followUserEntity);

            // 팔로잉 관계 저장
            FollowingEntity followingEntity = new FollowingEntity();
            followingEntity.setUsername(followedUsername);
            followingEntity.setFollowing(myUsername);

            followingRepository.save(followingEntity);

            // 팔로우 응답 객체 생성
            FollowResponse followResponse = new FollowResponse();
            followResponse.setFollowerEntity(followUserEntity);
            followResponse.setFollowingEntity(followingEntity);

            return new ApiResponse<Object>(200, followResponse, "팔로우 성공");
        } catch (Exception e) {
            return new ApiResponse<Object>(500, null, "팔로우 실패: " + e.getMessage());
        }
    }

    @Transactional
    public ApiResponse<Object> unfollowUser(String myUsername, String unfollowedUsername) {
        try {

            // 언팔로우하려는 유저가 존재하는지 확인
            UserEntity followedUser = userRepository.findByUsername(unfollowedUsername);

            if (followedUser == null) {
                return new ApiResponse<Object>(404, null, "언팔로우하려는 유저를 찾을 수 없습니다.");
            }

            if (unfollowedUsername.equals(myUsername)) {
                return new ApiResponse<Object>(400, null, "자기 자신은 언팔로우할 수 없습니다.");
            }

            // int followerCount = userRepository.minusFollower(unfollowedUsername);
            // int followingCount = userRepository.minusFollowing(myUsername);

            // System.out.println("팔로워 수: " + followerCount);
            // System.out.println("팔로잉 수: " + followingCount);

            // 팔로워 관계 삭제
            followerRepository.deleteByUsernameAndFollowed(myUsername, unfollowedUsername);

            // 팔로잉 관계 삭제
            followingRepository.deleteByUsernameAndFollowing(unfollowedUsername, myUsername);

            return new ApiResponse<Object>(200, null, "언팔로우 성공");
        } catch (Exception e) {
            return new ApiResponse<Object>(500, null, "언팔로우 실패: " + e.getMessage());
        }
    }

    public ApiResponse<Object> getFollowers(String myUsername) {
        try {
            List<FollowerEntity> follower = followerRepository.findFollowerByUsername(myUsername);

            if (follower == null) {
                return new ApiResponse<Object>(404, null, "팔로우한 유저가 없거나 유저를 찾을 수 없습니다.");
            }

            return new ApiResponse<Object>(200, follower, "팔로워 목록 조회 성공");
        } catch (Exception e) {
            return new ApiResponse<Object>(500, null, "팔로워 목록 조회 실패: " + e.getMessage());
        }
    }

    public ApiResponse<Object> getFollowings(String myUsername) {
        try {
            List<FollowingEntity> following = followingRepository.findFollowingByUsername(myUsername);

            if (following == null) {
                return new ApiResponse<Object>(404, null, "팔로잉한 유저가 없거나 유저를 찾을 수 없습니다.");
            }

            return new ApiResponse<Object>(200, following, "팔로잉 목록 조회 성공");
        } catch (Exception e) {
            return new ApiResponse<Object>(500, null, "팔로잉 목록 조회 실패: " + e.getMessage());
        }
    }
}
