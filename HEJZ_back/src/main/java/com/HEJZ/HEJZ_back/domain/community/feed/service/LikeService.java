package com.HEJZ.HEJZ_back.domain.community.feed.service;

import com.HEJZ.HEJZ_back.domain.community.feed.dto.LikeRequest;
import com.HEJZ.HEJZ_back.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LikeService {
    public ApiResponse<Object> like(LikeRequest likeRequest){
        
        try{



            return new ApiResponse<>(200, null, "좋아요 성공");
            
        }catch (Exception e){
            return new ApiResponse<>(500, null, "좋아요 실패");
            
        }
    }
}
