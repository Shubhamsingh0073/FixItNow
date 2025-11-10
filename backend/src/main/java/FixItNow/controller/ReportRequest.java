package FixItNow.controller;

public class ReportRequest {
    private String reportedById;
    private String reportedOnId;
    private String reason;

    public ReportRequest() {}

    public ReportRequest(String reportedById, String reportedOnId, String reason) {
        this.reportedById = reportedById;
        this.reportedOnId = reportedOnId;
        this.reason = reason;
    }

    public String getReportedById() {
        return reportedById;
    }

    public void setReportedById(String reportedById) {
        this.reportedById = reportedById;
    }

    public String getReportedOnId() {
        return reportedOnId;
    }

    public void setReportedOnId(String reportedOnId) {
        this.reportedOnId = reportedOnId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}