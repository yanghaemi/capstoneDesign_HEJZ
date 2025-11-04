package com.HEJZ.HEJZ_back.domain.community.recommendation.listener;

import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import com.HEJZ.HEJZ_back.domain.community.feed.repository.FeedRepository;
import com.HEJZ.HEJZ_back.domain.community.recommendation.event.FeedLikedEvent;
import com.HEJZ.HEJZ_back.domain.community.recommendation.event.FeedUnlikedEvent;
import com.HEJZ.HEJZ_back.domain.community.recommendation.service.PrefStoreService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class FeedLikeEventHandler {

    private final FeedRepository feedRepository;
    private final PrefStoreService pref;

    @Async
    @EventListener
    public void onFeedLiked(FeedLikedEvent e) {
        var feed = feedRepository.findById(e.feedId()).orElse(null);
        if (feed == null)
            return;

        // 감정/장르 가중치 +1
        pref.add(e.userId(), "emotion: " + feed.getEmotion(), 1.0);
        pref.add(e.userId(), "genre: " + feed.getGenre(), 1.0);
    }

    @Async
    @EventListener
    public void onFeedUnliked(FeedUnlikedEvent e) {
        var feed = feedRepository.findById(e.feedId()).orElse(null);
        if (feed == null)
            return;

        pref.add(e.userId(), "emotion:" + feed.getEmotion(), -1.0);
        pref.add(e.userId(), "genre:" + feed.getGenre(), -1.0);
    }
}
