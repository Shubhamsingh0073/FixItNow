package FixItNow.repository;

import FixItNow.model.Reviews;
import FixItNow.model.Users;
import FixItNow.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReviewsRepository extends JpaRepository<Reviews, String> {
    List<Reviews> findByProvider(Users provider);
    List<Reviews> findByCustomer(Users customer);
    List<Reviews> findByBooking(Booking booking);
	
	@Query("SELECT MAX(r.id) FROM Reviews r")
	String findMaxReviewsId();
}
