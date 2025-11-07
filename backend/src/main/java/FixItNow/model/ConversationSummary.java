package FixItNow.model;

import java.time.LocalDateTime;

public class ConversationSummary {
    private String peerId;
    private String peerName;
    private String lastMessage;
    private LocalDateTime lastAt;

    public ConversationSummary() {}

    public ConversationSummary(String peerId, String peerName, String lastMessage, LocalDateTime lastAt) {
        this.peerId = peerId;
        this.peerName = peerName;
        this.lastMessage = lastMessage;
        this.lastAt = lastAt;
    }

    public String getPeerId() {
        return peerId;
    }

    public void setPeerId(String peerId) {
        this.peerId = peerId;
    }

    public String getPeerName() {
        return peerName;
    }

    public void setPeerName(String peerName) {
        this.peerName = peerName;
    }

    public String getLastMessage() {
        return lastMessage;
    }

    public void setLastMessage(String lastMessage) {
        this.lastMessage = lastMessage;
    }

    public LocalDateTime getLastAt() {
        return lastAt;
    }

    public void setLastAt(LocalDateTime lastAt) {
        this.lastAt = lastAt;
    }
}
