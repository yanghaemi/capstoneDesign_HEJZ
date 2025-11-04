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
        private String task_id;
        private List<AudioData> data;
    }

    @Getter
    @Setter
    public static class AudioData {
        private String id;
        private String audio_url;
        private String source_audio_url;
        private String stream_audio_url;
        private String source_stream_audio_url;
        private String image_url;
        private String source_image_url;
        private String prompt;
        private String model_name;
        private String title;
        private String tags;
        private String createTime;
        private double duration;

        public String getAudio_url() {
            return audio_url;
        }

        public String getSource_audio_url() {
            return source_audio_url;
        }

        public String getStream_audio_url() {
            return stream_audio_url;
        }

        public String getSource_stream_audio_url() {
            return source_stream_audio_url;
        }

        public String getImage_url() {
            return image_url;
        }

        public String getSource_image_url() {
            return source_image_url;
        }

        public String getModel_name() {
            return model_name;
        }
    }
}
