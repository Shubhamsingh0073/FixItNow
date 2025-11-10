package FixItNow.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import FixItNow.controller.ReportRequest;
import FixItNow.model.Report;
import FixItNow.manager.ReportManager;

import java.net.URI;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportManager reportManager;

    public ReportController(ReportManager reportManager) {
        this.reportManager = reportManager;
    }

    /**
     * Create a new report.
     * Expected JSON body:
     * {
     *   "reportedById": "U4",
     *   "reportedOnId": "U3",
     *   "reason": "provider did not show up"
     * }
     */
    @PostMapping
    public ResponseEntity<?> createReport(@RequestBody ReportRequest req) {
        try {
            Report created = reportManager.createReport(req.getReportedById(), req.getReportedOnId(), req.getReason());
            // Return 201 with the new report id and a small payload
            return ResponseEntity.created(URI.create("/api/reports/" + created.getId()))
                    .body(Map.of(
                            "id", created.getId(),
                            "reportedBy", created.getReportedBy().getId(),
                            "reportedOn", created.getReportedOn().getId(),
                            "reason", created.getReason(),
                            "createdAt", created.getCreatedAt()
                    ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (Exception ex) {
            // log exception in real app
            return ResponseEntity.status(500).body(Map.of("message", "Could not create report"));
        }
    }

    /**
     * Optional: list all reports (admin use)
     */
    @GetMapping
    public ResponseEntity<List<Report>> listAll() {
        return ResponseEntity.ok(reportManager.findAll());
    }

    /**
     * Optional: get reports for a reportedOn user
     */
    @GetMapping("/reported-on/{userId}")
    public ResponseEntity<List<Report>> getByReportedOn(@PathVariable String userId) {
        return ResponseEntity.ok(reportManager.findByReportedOn(userId));
    }
}