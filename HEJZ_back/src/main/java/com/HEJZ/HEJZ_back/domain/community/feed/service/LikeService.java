package com.HEJZ.HEJZ_back.domain.community.feed.service;

import com.HEJZ.HEJZ_back.domain.community.feed.dto.CommentLikeRequest;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.FeedItemDto;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.FeedLikeRequest;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.LikeDto;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.MediaDto;
import com.HEJZ.HEJZ_back.domain.community.feed.dto.TargetType;
import com.HEJZ.HEJZ_back.domain.community.feed.entity.CommentEntity;
import com.HEJZ.HEJZ_back.domain.community.feed.entity.CommentLikeEntity;
import com.HEJZ.HEJZ_back.domain.community.feed.entity.FeedEntity;
import com.HEJZ.HEJZ_back.domain.community.feed.entity.FeedLikeEntity;
import com.HEJZ.HEJZ_back.domain.community.feed.entity.FeedMediaEntity;
import com.HEJZ.HEJZ_back.domain.community.feed.repository.CommentLikeRepository;
import com.HEJZ.HEJZ_back.domain.community.feed.repository.FeedLikeRepository;
import com.HEJZ.HEJZ_back.domain.community.feed.repository.FeedRepository;
import com.HEJZ.HEJZ_back.domain.community.recommendation.service.PrefStoreService;
import com.HEJZ.HEJZ_back.domain.community.user.entity.UserEntity;
import com.HEJZ.HEJZ_back.domain.community.user.repository.UserRepository;
import com.HEJZ.HEJZ_back.domain.music.dto.SavedSongDTO;
import com.HEJZ.HEJZ_back.domain.music.entity.SavedSong;
import com.HEJZ.HEJZ_back.global.response.ApiResponse;

import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Transactional
public class LikeService {

    private final CommentLikeRepository commentLikeRepository;
    private final FeedLikeRepository feedLikeRepository;
    private final FeedRepository feedRepository;
    private final UserRepository userRepository;
    private final EntityManager em;
    private final PrefStoreService prefStore;

    private LikeDto createLike(TargetType target, Long targetId, String username) {

        UserEntity user = userRepository.findByUsername(username);
        if (user == null) {
            return null;
        }

        Long userId = user.getId();

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

                FeedEntity feed = feedRepository.findById(targetId)
                        .orElseThrow(() -> new RuntimeException("피드를 찾지 못했습니다."));

                var likeEntity = new FeedLikeEntity();
                likeEntity.setUser(user);
                likeEntity.setFeed(em.getReference(FeedEntity.class, targetId));
                var saved = feedLikeRepository.save(likeEntity);

                // 피드에만 좋아요 알고리즘 적용
                prefStore.add(userId, "author:" + feed.getUser().getId(), +1.0);
                prefStore.add(userId, "genre:" + feed.getGenre(), +0.7);
                prefStore.add(userId, "emotion:" + feed.getEmotion(), +0.4);

                yield LikeDto.liked(saved.getId(), TargetType.FEED, targetId, username, saved.getCreatedAt());
            }
        };
    }

    public ApiResponse<Object> commentLike(CommentLikeRequest likeRequest, String username) {

        try {

            var dto = createLike(TargetType.COMMENT, likeRequest.getCommentId(), username);

            if (dto == null) {
                return new ApiResponse<Object>(404, null, "피드 좋아요 실패");
            }

            return new ApiResponse<>(200, dto, "댓글 좋아요 성공");

        } catch (Exception e) {
            return new ApiResponse<>(500, null, "댓글 좋아요 실패");

        }
    }

    public ApiResponse<Object> feedLike(FeedLikeRequest likeRequest, String username) {

        try {

            var dto = createLike(TargetType.FEED, likeRequest.feedId(), username);

            if (dto == null) {
                return new ApiResponse<Object>(404, null, "피드 좋아요 실패");
            }

            return new ApiResponse<>(200, dto, "피드 좋아요 성공");

        } catch (Exception e) {
            return new ApiResponse<>(500, null, "피드 좋아요 실패");

        }
    }

    private List<FeedItemDto> getFeedDtos(List<FeedLikeEntity> likes) {

        List<FeedItemDto> dtos = likes.stream()
                .map(FeedLikeEntity::getFeed)
                .map(f -> {
                    List<MediaDto> media = f.getImages().stream()
                            .sorted(Comparator.comparingInt(FeedMediaEntity::getOrd))
                            .map(m -> new MediaDto(
                                    m.getUrl(),
                                    m.getOrd(),
                                    m.getType(),
                                    m.getThumbnailUrl(),
                                    m.getDurationMs(),
                                    m.getMimeType()))
                            .toList();

                    SavedSongDTO songDto = null;
                    if (f.getSong() != null) {
                        SavedSong song = f.getSong();
                        songDto = new SavedSongDTO(
                                song.getTitle(),
                                song.getTaskId(),
                                song.getAudioId(),
                                song.getAudioUrl(),
                                song.getSourceAudioUrl(),
                                song.getStreamAudioUrl(),
                                song.getSourceStreamAudioUrl(),
                                song.getPrompt(),
                                song.getLyricsJson(),
                                song.getPlainLyrics());
                    }

                    return new FeedItemDto(
                            f.getId(),
                            f.getUser().getId(),
                            f.getContent(),
                            media,
                            songDto,
                            f.getEmotion(),
                            f.getGenre(),
                            f.getCreatedAt());
                })
                .toList();

        return dtos;
    }

    @Transactional
    public ApiResponse<Object> getListOfLike(FeedLikeRequest likeRequest) {

        try {

            List<FeedLikeEntity> likes = feedLikeRepository.findByFeedId(likeRequest.feedId());

            return new ApiResponse<>(200, getFeedDtos(likes), "해당 피드/댓글의 좋아요 리스트 조회 성공");

        } catch (Exception e) {
            return new ApiResponse<>(500, null, "해당 피드/댓글의 좋아요 리스트 조회 실패");

        }
    }

    @Transactional
    public ApiResponse<Object> getMyListOfLike(String username) {

        try {
            Long id = userRepository.findIdByUsername(username);

            List<FeedLikeEntity> likes = feedLikeRepository.findByUserId(id);

            return new ApiResponse<>(200, getFeedDtos(likes), "내 좋아요 리스트 조회 성공");

        } catch (Exception e) {
            return new ApiResponse<>(500, null, "내 좋아요 리스트 조회 실패");

        }
    }

}
