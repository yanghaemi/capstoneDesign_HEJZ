package com.HEJZ.HEJZ_back.domain.community.follow.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.HEJZ.HEJZ_back.domain.community.follow.dto.FollowDto;
import com.HEJZ.HEJZ_back.domain.community.follow.entity.FollowEntity;
import com.HEJZ.HEJZ_back.domain.community.follow.repository.FollowRepository;
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
    private final FollowRepository followRepository;

    @Transactional
    public ApiResponse<Object> followUser(String myUsername, String targetUsername) {
        try {

            // 팔로우하려는 유저가 존재하는지 확인
            UserEntity target = userRepository.findByUsername(targetUsername);
            UserEntity me = userRepository.findByUsername(myUsername);

            System.out.println("팔로우 시도: " + myUsername + " -> " + targetUsername);

            if (target == null || me == null) {
                return new ApiResponse<Object>(404, null, "팔로우하려는 유저를 찾을 수 없습니다.");
            }

            if (followRepository.existsByFollower_UsernameAndFollowing_Username(myUsername, targetUsername)) {
                return new ApiResponse<Object>(409, null, "이미 팔로우 중입니다.");
            }

            if (targetUsername.equals(myUsername)) {
                return new ApiResponse<Object>(400, null, "자기 자신은 팔로우할 수 없습니다.");
            }

            // DB에 팔로우 관계 저장
            FollowEntity follow = new FollowEntity();
            follow.setFollower(me);
            follow.setFollowing(target);
            followRepository.save(follow);

            return new ApiResponse<Object>(200, follow, "팔로우 성공");
        } catch (Exception e) {
            return new ApiResponse<Object>(500, null, "팔로우 실패: " + e.getMessage());
        }
    }

    @Transactional
    public ApiResponse<Object> unfollowUser(String myUsername, String targetUsername) {
        try {

            // 언팔로우하려는 유저가 존재하는지 확인
            UserEntity target = userRepository.findByUsername(targetUsername);

            if (target == null) {
                return new ApiResponse<Object>(404, null, "언팔로우하려는 유저를 찾을 수 없습니다.");
            }

            if (targetUsername.equals(myUsername)) {
                return new ApiResponse<Object>(400, null, "자기 자신은 언팔로우할 수 없습니다.");
            }

            followRepository.deleteByFollowerUsernameAndFollowingUsername(myUsername, targetUsername);

            return new ApiResponse<Object>(200, null, "언팔로우 성공");
        } catch (Exception e) {
            return new ApiResponse<Object>(500, null, "언팔로우 실패: " + e.getMessage());
        }
    }

    @Transactional
    public ApiResponse<Object> getFollowers(String myUsername) {
        try {
            List<FollowEntity> followers = followRepository.findByFollowingUsername(myUsername);

            if (followers == null) {
                return new ApiResponse<Object>(404, null, "팔로우한 유저가 없거나 유저를 찾을 수 없습니다.");
            }

            // DB에서 가져온 Entity를 DTO에 담아 response
            List<FollowDto> followersList = followers.stream()
                    .map(f -> new FollowDto(
                            f.getFollower().getUsername(),
                            f.getFollower().getNickname(),
                            f.getFollower().getProfileImageUrl()))
                    .toList();

            return new ApiResponse<Object>(200, followersList, "팔로워 목록 조회 성공");
        } catch (Exception e) {
            return new ApiResponse<Object>(500, null, "팔로워 목록 조회 실패: " + e.getMessage());
        }
    }

    @Transactional
    public ApiResponse<Object> getFollowings(String myUsername) {
        try {
            List<FollowEntity> followings = followRepository.findByFollowerUsername(myUsername);

            if (followings == null) {
                return new ApiResponse<Object>(404, null, "유저를 찾을 수 없습니다.");
            }

            // DB에서 가져온 Entity를 DTO에 담아 response
            List<FollowDto> followingsList = followings.stream()
                    .map(f -> new FollowDto(
                            f.getFollowing().getUsername(),
                            f.getFollowing().getNickname(),
                            f.getFollowing().getProfileImageUrl()))
                    .toList();

            return new ApiResponse<Object>(200, followingsList, "팔로잉 목록 조회 성공");
        } catch (Exception e) {
            return new ApiResponse<Object>(500, null, "팔로잉 목록 조회 실패: " + e.getMessage());
        }
    }

    @Transactional
    public ApiResponse<Object> isInterFollow(String myUsername, String targetUsername) {
        try {

            List<FollowEntity> followers = followRepository.findByFollowerUsername(myUsername);

            if (followers == null) {
                return new ApiResponse<Object>(404, null, "팔로워를 찾을 수 없습니다.");
            }

            // 내가 타겟을 팔로우 중?
            boolean doIFollowTarget = followRepository
                    .existsByFollower_UsernameAndFollowing_Username(myUsername, targetUsername);

            // 타겟이 나를 팔로우 중?
            boolean doesTargetFollowMe = followRepository
                    .existsByFollower_UsernameAndFollowing_Username(targetUsername, myUsername);

            boolean result = doIFollowTarget && doesTargetFollowMe;

            return new ApiResponse<Object>(200, result, result ? "맞팔입니다." : "맞팔이 아닙니다.");

        } catch (Exception e) {
            return new ApiResponse<Object>(500, null, "맞팔 여부 조회 실패");
        }
    }
}
