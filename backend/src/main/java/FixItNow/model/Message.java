package FixItNow.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import jakarta.persistence.PrePersist;
import java.util.UUID;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @Column(name = "message_id", unique = true, updatable = false, nullable = false)
    private String id;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private Users sender;

    @ManyToOne
    @JoinColumn(name = "receiver_id", nullable = false)
    private Users receiver;

    @Lob
    private String content;

    @CreationTimestamp
    private LocalDateTime sentAt;

    @PrePersist
    public void ensureId() {
        if (this.id == null || this.id.isBlank()) {
            this.id = "M" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        }
    }

    // Getters and setters (same as you had)
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Users getSender() { return sender; }
    public void setSender(Users sender) { this.sender = sender; }

    public Users getReceiver() { return receiver; }
    public void setReceiver(Users receiver) { this.receiver = receiver; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
}