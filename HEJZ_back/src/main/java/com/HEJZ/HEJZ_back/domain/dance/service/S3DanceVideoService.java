package com.HEJZ.HEJZ_back.domain.dance.service;

import com.HEJZ.HEJZ_back.global.exception.CustomException;
import com.HEJZ.HEJZ_back.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.net.URL;
import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
public class S3DanceVideoService {

    private final S3Presigner s3Presigner;

    @Value("${cloud.aws.s3.bucket}")
    private String bucketName;

    // 단일 presigned URL 생성
    public String getPresignedUrl(String motionId) {
        final String key = "final_videos/dance_video/" + motionId + "_body.mp4";
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .responseContentType("video/mp4") // 플레이어 인식용
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .getObjectRequest(getObjectRequest)
                    .signatureDuration(Duration.ofMinutes(10))
                    .build();

            URL url = s3Presigner.presignGetObject(presignRequest).url();
            return url.toString();

        } catch (S3Exception e) {
            // 키오류/권한 등 S3단 에러
            throw new CustomException(ErrorCode.VIDEO_NOT_FOUND);
        } catch (Exception e) {
            throw new CustomException(ErrorCode.UNKNOWN_SERVER_ERROR);
        }
    }

    // 여러 개 presigned URL 생성
    public List<String> getPresignedUrls(List<String> motionIds) {
        return motionIds.stream().map(this::getPresignedUrl).toList();
    }
}
