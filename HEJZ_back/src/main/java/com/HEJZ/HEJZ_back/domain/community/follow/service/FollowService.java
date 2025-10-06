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

@Service
@AllArgsConstructor
public class FollowService {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;

    @Transactional
    public ApiResponse<Object> followUser(String myUsername, String targetUsername) {
        try {
            UserEntity me = userRepository.findByUsername(myUsername);
            UserEntity target = userRepository.findByUsername(targetUsername);

            if (me == null || target == null) {
                return new ApiResponse<>(404, null, "팔로우하려는 유저를 찾을 수 없습니다.");
            }
            if (targetUsername.equals(myUsername)) {
                return new ApiResponse<>(400, null, "자기 자신은 팔로우할 수 없습니다.");
            }
            if (followRepository.existsByFollower_UsernameAndFollowing_Username(myUsername, targetUsername)) {
                return new ApiResponse<>(409, null, "이미 팔로우 중입니다.");
            }

            FollowEntity follow = FollowEntity.builder()
                    .follower(me)
                    .following(target)
                    .build();
            followRepository.save(follow);

            return new ApiResponse<>(200, follow, "팔로우 성공");
        } catch (Exception e) {
            return new ApiResponse<>(500, null, "팔로우 실패: " + e.getMessage());
        }
    }

    @Transactional
    public ApiResponse<Object> unfollowUser(String myUsername, String targetUsername) {
        try {
            UserEntity target = userRepository.findByUsername(targetUsername);
            if (target == null) {
                return new ApiResponse<>(404, null, "언팔로우하려는 유저를 찾을 수 없습니다.");
            }
            if (targetUsername.equals(myUsername)) {
                return new ApiResponse<>(400, null, "자기 자신은 언팔로우할 수 없습니다.");
            }

            followRepository.deleteByFollower_UsernameAndFollowing_Username(myUsername, targetUsername);
            return new ApiResponse<>(200, null, "언팔로우 성공");
        } catch (Exception e) {
            return new ApiResponse<>(500, null, "언팔로우 실패: " + e.getMessage());
        }
    }

    @Transactional
    public ApiResponse<Object> getFollowers(String myUsername) {
        try {
            // 나를 팔로우하는 사람들 = following == 나
            List<FollowEntity> rows = followRepository.findByFollowing_Username(myUsername);

            // JPA는 리스트를 null로 주지 않으므로 null 체크 불필요(빈 리스트면 0건)
            var list = rows.stream()
                    .map(f -> new FollowDto(
                            f.getFollower().getUsername(),
                            f.getFollower().getNickname(),
                            f.getFollower().getProfileImageUrl()))
                    .toList();

            return new ApiResponse<>(200, list, "팔로워 목록 조회 성공");
        } catch (Exception e) {
            return new ApiResponse<>(500, null, "팔로워 목록 조회 실패: " + e.getMessage());
        }
    }

    @Transactional
    public ApiResponse<Object> getFollowings(String myUsername) {
        try {
            // 내가 팔로우하는 사람들 = follower == 나
            List<FollowEntity> rows = followRepository.findByFollower_Username(myUsername);

            var list = rows.stream()
                    .map(f -> new FollowDto(
                            f.getFollowing().getUsername(),
                            f.getFollowing().getNickname(),
                            f.getFollowing().getProfileImageUrl()))
                    .toList();

            return new ApiResponse<>(200, list, "팔로잉 목록 조회 성공");
        } catch (Exception e) {
            return new ApiResponse<>(500, null, "팔로잉 목록 조회 실패: " + e.getMessage());
        }
    }

    @Transactional
    public ApiResponse<Object> isInterFollow(String myUsername, String targetUsername) {
        try {
            boolean doIFollowTarget = followRepository
                    .existsByFollower_UsernameAndFollowing_Username(myUsername, targetUsername);
            boolean doesTargetFollowMe = followRepository
                    .existsByFollower_UsernameAndFollowing_Username(targetUsername, myUsername);

            boolean result = doIFollowTarget && doesTargetFollowMe;
            return new ApiResponse<>(200, result, result ? "맞팔입니다." : "맞팔이 아닙니다.");
        } catch (Exception e) {
            return new ApiResponse<>(500, null, "맞팔 여부 조회 실패");
        }
    }
}