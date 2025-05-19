package com.HEJZ.HEJZ_back.dto;

public class SunoResponse {
    private int code;
    private String msg;
    private SunoData data;

    public int getCode() { return code; }
    public void setCode(int code) { this.code = code; }

    public String getMsg() { return msg; }
    public void setMsg(String msg) { this.msg = msg; }

    public SunoData getData() { return data; }
    public void setData(SunoData data) { this.data = data; }

    // 내부 클래스
    public static class SunoData {
        private String taskId;

        public String getTaskId() { return taskId; }
        public void setTaskId(String taskId) { this.taskId = taskId; }
    }
}
