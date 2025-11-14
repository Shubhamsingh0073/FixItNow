package FixItNow.manager;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import FixItNow.model.Booking;
import FixItNow.model.Report;
import FixItNow.model.ReportEnum;
import FixItNow.model.Users;
import FixItNow.repository.BookingRepository;
import FixItNow.repository.ReportRepository;
import FixItNow.repository.ServicesRepository;
import FixItNow.repository.UsersRepository;

import java.util.List;
import java.util.Optional;

@Service
public class ReportManager {

	@Autowired
    private ReportRepository reportRepository;
	
	@Autowired
    private UsersRepository usersRepository;
	
	@Autowired
    private BookingRepository bookingRepository;
	

    @Transactional
    public Report createReport(String reportedById, String reportedOnId, String reason, ReportEnum.Category category, String bookingId) {
        if (reportedById == null || reportedOnId == null || reason == null || category == null || bookingId == null) {
            throw new IllegalArgumentException("reportedById, reportedOnId, reason, category and bookingId must be provided");
        }

        Optional<Users> byOpt = usersRepository.findById(reportedById);
        Optional<Users> onOpt = usersRepository.findById(reportedOnId);
        Optional<Booking> bkOpt = bookingRepository.findById(bookingId);

        if (byOpt.isEmpty()) throw new IllegalArgumentException("reportedBy user not found");
        if (onOpt.isEmpty()) throw new IllegalArgumentException("reportedOn user not found");
        if (bkOpt.isEmpty()) throw new IllegalArgumentException("booking not found");

        Users reportedBy = byOpt.get();
        Users reportedOn = onOpt.get();
        Booking booking = bkOpt.get();

        Report r = new Report();
        r.setReportedBy(reportedBy);
        r.setReportedOn(reportedOn);
        r.setReason(reason);
        r.setReply(null); // explicitly null by default
        r.setStatus(ReportEnum.Status.PENDING); // ensure pending
        r.setCategory(category);
        r.setBooking(booking);

        return reportRepository.save(r);
    }
    
    @Transactional(readOnly = true)
    public List<Report> findReportsByReporter(String reportedById) {
        return reportRepository.findByReportedBy_Id(reportedById);
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
    
    @Transactional
    public Report updateStatusAndReply(Integer id, ReportEnum.Status status, String reply) {
        Optional<Report> opt = reportRepository.findById(id);
        if (opt.isEmpty()) return null;
        Report r = opt.get();
        if (status != null) r.setStatus(status);
        // allow explicit null to clear reply if client sends null
        r.setReply(reply);
        Report saved = reportRepository.save(r);
        // flush is optional; save() returns the managed entity
        return saved;
    }
}