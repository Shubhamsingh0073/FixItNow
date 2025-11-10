package FixItNow.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import FixItNow.model.Report;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Integer> {
    // Derived query that looks up Report.reportedOn.id (uses property name "id" on Users)
    List<Report> findByReportedOn_Id(String reportedOnId);

    // Derived query that looks up Report.reportedBy.id
    List<Report> findByReportedBy_Id(String reportedById);
}