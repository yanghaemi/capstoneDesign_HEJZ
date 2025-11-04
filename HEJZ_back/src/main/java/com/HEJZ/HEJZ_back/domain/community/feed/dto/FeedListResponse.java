package com.HEJZ.HEJZ_back.domain.community.feed.dto;

import java.util.List;

public record FeedListResponse(
                List<FeedScoreDebugDto> items,
                String nextCursor) {
}
