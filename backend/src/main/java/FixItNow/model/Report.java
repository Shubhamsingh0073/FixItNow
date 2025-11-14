package FixItNow.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "reported_on", nullable = false)
    private Users reportedOn;

    @ManyToOne
    @JoinColumn(name = "reported_by", nullable = false)
    private Users reportedBy;

    @Lob
    private String reason;
    
    @Lob
    private String reply;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportEnum.Status status = ReportEnum.Status.PENDING;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportEnum.Category category;
    
    @ManyToOne
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @CreationTimestamp
    private LocalDateTime createdAt;

    // Getters and setters

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Users getReportedOn() {
        return reportedOn;
    }

    public void setReportedOn(Users reportedOn) {
        this.reportedOn = reportedOn;
    }

    public Users getReportedBy() {
        return reportedBy;
    }

    public void setReportedBy(Users reportedBy) {
        this.reportedBy = reportedBy;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
    
    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }
    
    public ReportEnum.Status getStatus() {
        return status;
    }

    public void setStatus(ReportEnum.Status status) {
        this.status = status;
    }

    public ReportEnum.Category getCategory() {
        return category;
    }

    public void setCategory(ReportEnum.Category category) {
        this.category = category;
    }
    
    public Booking getBooking() {
        return booking;
    }

    public void setBooking(Booking booking) {
        this.booking = booking;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    // createdAt is set automatically with @CreationTimestamp, no setter required,
    // but provided here in case a setter is needed elsewhere:
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}