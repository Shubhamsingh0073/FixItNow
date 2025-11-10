package FixItNow.manager;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import FixItNow.model.Report;
import FixItNow.model.Users;
import FixItNow.repository.ReportRepository;
import FixItNow.repository.UsersRepository;

import java.util.Optional;

@Service
public class ReportManager {

    private final ReportRepository reportRepository;
    private final UsersRepository usersRepository;

    public ReportManager(ReportRepository reportRepository, UsersRepository usersRepository) {
        this.reportRepository = reportRepository;
        this.usersRepository = usersRepository;
    }

    @Transactional
    public Report createReport(String reportedById, String reportedOnId, String reason) {
        // Validate inputs
        if (reportedById == null || reportedOnId == null || reason == null) {
            throw new IllegalArgumentException("reportedById, reportedOnId and reason must be provided");
        }

        Optional<Users> byOpt = usersRepository.findById(reportedById);
        Optional<Users> onOpt = usersRepository.findById(reportedOnId);

        if (byOpt.isEmpty() || onOpt.isEmpty()) {
            throw new IllegalArgumentException("reportedBy or reportedOn user not found");
        }

        Users reportedBy = byOpt.get();
        Users reportedOn = onOpt.get();

        Report r = new Report();
        r.setReportedBy(reportedBy);
        r.setReportedOn(reportedOn);
        r.setReason(reason);

        return reportRepository.save(r);
    }

    // Optional convenience methods
    public java.util.List<Report> findAll() {
        return reportRepository.findAll();
    }

    public java.util.List<Report> findByReportedOn(String reportedOnId) {
        return reportRepository.findByReportedOn_Id(reportedOnId);
    }

    public java.util.List<Report> findByReportedBy(String reportedById) {
        return reportRepository.findByReportedBy_Id(reportedById);
    }
}