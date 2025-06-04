package com.HEJZ.HEJZ_back.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SunoRequest {
    private String prompt;
    private String style;
    private String title;
    private boolean customMode;
    private boolean instrumental;
    private String model;
    private String callBackUrl;

}
