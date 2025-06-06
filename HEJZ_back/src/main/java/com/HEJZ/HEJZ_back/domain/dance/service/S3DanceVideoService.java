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
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class S3DanceVideoService {

    private final S3Presigner s3Presigner;

    @Value("${cloud.aws.s3.bucket}")
    private String bucketName;

    public Map<String, Object> getPresignedUrlForMotion(String motionId) {
        try {
            String key = "videos/" + motionId + ".mp4";

            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .getObjectRequest(getObjectRequest)
                    .signatureDuration(Duration.ofMinutes(10))
                    .build();

            URL presignedUrl = s3Presigner.presignGetObject(presignRequest).url();

            Map<String, Object> result = new HashMap<>();
            result.put("motionId", motionId);
            result.put("type", "video");
            result.put("fileUrl", presignedUrl.toString());

            return result;

        } catch (S3Exception e) {
            throw new CustomException(ErrorCode.VIDEO_NOT_FOUND);
        } catch (Exception e) {
            throw new CustomException(ErrorCode.UNKNOWN_SERVER_ERROR);
        }
    }
}
