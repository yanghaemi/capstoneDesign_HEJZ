package com.HEJZ.HEJZ_back.domain.music.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SunoResponse {
    private int code;
    private String msg;
    private CallbackData data;

    @Getter
    @Setter
    public static class CallbackData {
        private String callbackType;
        private String taskId;
        private List<AudioData> data;
    }

    @Getter
    @Setter
    public static class AudioData {
        private String id;
        private String audioUrl;
        private String sourceAudioUrl;
        private String streamAudioUrl;
        private String sourceStreamAudioUrl;
        private String imageUrl;
        private String sourceImageUrl;
        private String prompt;
        private String modelName;
        private String title;
        private String tags;
        private String createTime;
        private double duration;
    }
}
