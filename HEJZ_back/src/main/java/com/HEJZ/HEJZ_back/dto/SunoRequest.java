package com.HEJZ.HEJZ_back.dto;

public class SunoRequest {
    private String prompt;
    private String style;
    private String title;
    private boolean customMode;
    private boolean instrumental;
    private String model;
    private String callBackUrl;

    // Getter & Setter
    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }

    public String getStyle() { return style; }
    public void setStyle(String style) { this.style = style; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public boolean isCustomMode() { return customMode; }
    public void setCustomMode(boolean customMode) { this.customMode = customMode; }

    public boolean isInstrumental() { return instrumental; }
    public void setInstrumental(boolean instrumental) { this.instrumental = instrumental; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getCallBackUrl() { return callBackUrl; }
    public void setCallBackUrl(String callBackUrl) { this.callBackUrl = callBackUrl; }
}
