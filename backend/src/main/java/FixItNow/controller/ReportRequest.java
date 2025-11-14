package FixItNow.controller;

import java.time.LocalDateTime;

public class ReportRequest {
    private Integer id;
    private String reportedById;
    private String reportedOnId;
    private String reason;
    private String category;  
    private String bookingId;
    private String status;
    private String reply;
    private LocalDateTime createdAt;

    public ReportRequest() {}

    public ReportRequest(Integer id, String reportedById, String reportedOnId, String reason, LocalDateTime createdAt) {
        this.id = id;
        this.reportedById = reportedById;
        this.reportedOnId = reportedOnId;
        this.reason = reason;
        this.createdAt = createdAt;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getReportedById() { return reportedById; }
    public void setReportedById(String reportedById) { this.reportedById = reportedById; }

    public String getReportedOnId() { return reportedOnId; }
    public void setReportedOnId(String reportedOnId) { this.reportedOnId = reportedOnId; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getBookingId() { return bookingId; }
    public void setBookingId(String bookingId) { this.bookingId = bookingId; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}