package com.HEJZ.HEJZ_back.domain.community.feed.service;

import com.HEJZ.HEJZ_back.domain.community.feed.dto.CommentLikeRequest;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.FeedLikeRequest;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.LikeDto;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.LikeListRequest;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.MyLikeRequest;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.TargetType;
import com.HEJZ.HEJZ_back.domain.community.feed.entity.CommentEntity;
import com.HEJZ.HEJZ_back.domain.community.feed.entity.CommentLikeEntity;
import com.HEJZ.HEJZ_back.domain.community.feed.entity.FeedEntity;
import com.HEJZ.HEJZ_back.domain.community.feed.entity.FeedLikeEntity;
import com.HEJZ.HEJZ_back.domain.community.feed.repository.CommentLikeRepository;
import com.HEJZ.HEJZ_back.domain.community.feed.repository.FeedLikeRepository;
import com.HEJZ.HEJZ_back.domain.community.user.entity.UserEntity;
import com.HEJZ.HEJZ_back.domain.community.user.repository.UserRepository;
import com.HEJZ.HEJZ_back.global.response.ApiResponse;

import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Transactional
public class LikeService {

    private final CommentLikeRepository commentLikeRepository;
    private final FeedLikeRepository feedLikeRepository;
    private final UserRepository userRepository;
    private final EntityManager em;

    private LikeDto createLike(TargetType target, Long targetId, String username) {

        UserEntity user = userRepository.findByUsername(username);
        if (user == null) {
            return null;
        }

        return switch (target) {
            case COMMENT -> {
                // 이미 눌렀으면 토글(취소)
                boolean exists = commentLikeRepository.existsByCommentIdAndUserId(targetId, user.getId());
                if (exists) {
                    commentLikeRepository.deleteByCommentIdAndUserId(targetId, user.getId());
                    yield LikeDto.unliked(TargetType.COMMENT, targetId, username);
                }
                var likeEntity = new CommentLikeEntity();
                likeEntity.setUser(user);
                likeEntity.setComment(em.getReference(CommentEntity.class, targetId)); // 조회 없이 프록시만
                var saved = commentLikeRepository.save(likeEntity);
                yield LikeDto.liked(saved.getId(), TargetType.COMMENT, targetId, username, saved.getCreatedAt());
            }
            case FEED -> {
                boolean exists = feedLikeRepository.existsByFeedIdAndUserId(targetId, user.getId());
                if (exists) {
                    feedLikeRepository.deleteByFeedIdAndUserId(targetId, user.getId());
                    yield LikeDto.unliked(TargetType.FEED, targetId, username);
                }
                var likeEntity = new FeedLikeEntity();
                likeEntity.setUser(user);
                likeEntity.setFeed(em.getReference(FeedEntity.class, targetId));
                var saved = feedLikeRepository.save(likeEntity);
                yield LikeDto.liked(saved.getId(), TargetType.FEED, targetId, username, saved.getCreatedAt());
            }
        };
    }

    public ApiResponse<Object> commentLike(CommentLikeRequest likeRequest, String username) {

        try {

            var dto = createLike(TargetType.COMMENT, likeRequest.getCommentId(), username);

            if (dto == null) {
                // TODO: 유저 없는 거 404 따로 만들기
                return new ApiResponse<Object>(404, null, "피드 좋아요 실패");
            }

            return new ApiResponse<>(200, dto, "댓글 좋아요 성공");

        } catch (Exception e) {
            return new ApiResponse<>(500, null, "댓글 좋아요 실패");

        }
    }

    public ApiResponse<Object> feedLike(FeedLikeRequest likeRequest, String username) {

        try {

            var dto = createLike(TargetType.FEED, likeRequest.getFeedId(), username);

            if (dto == null) {
                return new ApiResponse<Object>(404, null, "피드 좋아요 실패");
            }

            return new ApiResponse<>(200, dto, "피드 좋아요 성공");

        } catch (Exception e) {
            return new ApiResponse<>(500, null, "피드 좋아요 실패");

        }
    }

    public ApiResponse<Object> getListOfLike(LikeListRequest likeRequest) {

        try {

            return new ApiResponse<>(200, null, "해당 피드/댓글의 좋아요 리스트 조회 성공");

        } catch (Exception e) {
            return new ApiResponse<>(500, null, "해당 피드/댓글의 좋아요 리스트 조회 실패");

        }
    }

    public ApiResponse<Object> getMyListOfLike(String username) {

        

        try {

            return new ApiResponse<>(200, null, "내 좋아요 리스트 조회 성공");

        } catch (Exception e) {
            return new ApiResponse<>(500, null, "내 좋아요 리스트 조회 실패");

        }
    }
}
