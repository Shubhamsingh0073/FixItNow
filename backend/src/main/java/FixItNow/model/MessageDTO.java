package FixItNow.model;

import java.time.LocalDateTime;

public class MessageDTO {
    public String id;
    public String from;
    public String to;
    public String content;
    public LocalDateTime sentAt;

    public MessageDTO() {}

    public MessageDTO(String id, String from, String to, String content, LocalDateTime sentAt) {
        this.id = id;
        this.from = from;
        this.to = to;
        this.content = content;
        this.sentAt = sentAt;
    }
}