package FixItNow.repository;

import FixItNow.model.Booking;
import FixItNow.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, String> {
    List<Booking> findByProvider(Users provider);
    List<Booking> findByCustomer(Users customer);
    
    @Override
    Optional<Booking> findById(String id);

    Optional<Booking> findBookingById(String id);

    @Query("SELECT MAX(b.id) FROM Booking b")
    String findMaxBookingId();
}