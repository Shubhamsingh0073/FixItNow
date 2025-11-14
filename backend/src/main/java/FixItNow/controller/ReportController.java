package FixItNow.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import FixItNow.model.Report;
import FixItNow.model.ReportEnum;
import FixItNow.model.Users;
import FixItNow.repository.ServicesRepository;
import FixItNow.manager.ReportManager;
import FixItNow.manager.UsersManager;
import FixItNow.controller.ReportRequest;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*")

@RestController
@RequestMapping("/api/reports")
public class ReportController {
	
	 @Autowired
	 private UsersManager usersManager;

    private final ReportManager reportManager;

    public ReportController(ReportManager reportManager) {
        this.reportManager = reportManager;
    }

    @PostMapping
    public ResponseEntity<?> createReport(@RequestBody ReportRequest req) {
        try {
            // parse category
            ReportEnum.Category categoryEnum;
            try {
                categoryEnum = ReportEnum.Category.valueOf(req.getCategory().toUpperCase());
            } catch (Exception ex) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid category. Allowed: REPORT, REFUND"));
            }

            Report created = reportManager.createReport(
                    req.getReportedById(),
                    req.getReportedOnId(),
                    req.getReason(),
                    categoryEnum,
                    req.getBookingId()
            );

            return ResponseEntity.created(URI.create("/api/reports/" + created.getId()))
                    .body(Map.of(
                            "id", created.getId(),
                            "reportedBy", created.getReportedBy().getId(),
                            "reportedOn", created.getReportedOn().getId(),
                            "reason", created.getReason(),
                            "category", created.getCategory() != null ? created.getCategory().name() : null,
                            "status", created.getStatus() != null ? created.getStatus().name() : null,
                            "bookingId", created.getBooking() != null ? created.getBooking().getId() : null,
                            "createdAt", created.getCreatedAt()
                    ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Could not create report"));
        }
    }

    
    @GetMapping
    public ResponseEntity<List<Report>> listAll() {
        return ResponseEntity.ok(reportManager.findAll());
    }

   
    @GetMapping("/reported-on/{userId}")
    public ResponseEntity<List<Report>> getByReportedOn(@PathVariable String userId) {
        return ResponseEntity.ok(reportManager.findByReportedOn(userId));
    }
    
    @GetMapping("/customer")
    public ResponseEntity<?> getMyReports(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing Authorization header");
        }
        String token = authHeader.substring(7);
        String email = usersManager.validateToken(token);
        if ("401".equals(email)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired token");
        }

        Users user = usersManager.getUserByEmail(email);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
        }

        List<Report> reports = reportManager.findReportsByReporter(user.getId());

        List<ReportRequest> resp = reports.stream()
            .map(r -> {
                ReportRequest dto = new ReportRequest();
                dto.setId(r.getId());
                dto.setReportedById(r.getReportedBy() != null ? r.getReportedBy().getId() : null);
                dto.setReportedOnId(r.getReportedOn() != null ? r.getReportedOn().getId() : null);
                dto.setReason(r.getReason());
                dto.setCreatedAt(r.getCreatedAt());
                // category from enum -> string (REPORT / REFUND)
                dto.setCategory(r.getCategory() != null ? r.getCategory().name() : null);
                // booking id
                dto.setBookingId(r.getBooking() != null ? r.getBooking().getId() : null);
                // status from enum -> string (PENDING / ACCEPTED / REJECTED)
                dto.setStatus(r.getStatus() != null ? r.getStatus().name() : null);
                // reply
                dto.setReply(r.getReply());
                return dto;
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(resp);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateReportStatusAndReply(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Missing Authorization header"));
        }
        String token = authHeader.substring(7);
        String email = usersManager.validateToken(token);
        if ("401".equals(email)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid or expired token"));
        }

        String statusStr = payload.get("status") != null ? String.valueOf(payload.get("status")).trim() : null;
        String reply = payload.containsKey("reply") ? (payload.get("reply") != null ? String.valueOf(payload.get("reply")) : null) : null;

        ReportEnum.Status statusEnum = null;
        if (statusStr != null && !statusStr.isBlank()) {
            try {
                statusEnum = ReportEnum.Status.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid status value. Allowed: " +
                        String.join(", ", java.util.Arrays.stream(ReportEnum.Status.values()).map(Enum::name).toArray(String[]::new))));
            }
        }

        Report updatedReport = reportManager.updateStatusAndReply(id, statusEnum, reply);
        if (updatedReport == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Report not found"));
        }

        Map<String, Object> resp = Map.of(
                "id", updatedReport.getId(),
                "status", updatedReport.getStatus() != null ? updatedReport.getStatus().name() : null,
                "reply", updatedReport.getReply(),
                "bookingId", updatedReport.getBooking() != null ? updatedReport.getBooking().getId() : null,
                "category", updatedReport.getCategory() != null ? updatedReport.getCategory().name() : null,
                "createdAt", updatedReport.getCreatedAt()
        );

        return ResponseEntity.ok(resp);
    }
}