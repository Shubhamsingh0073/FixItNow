package FixItNow.manager;

import FixItNow.model.Booking;
import FixItNow.model.Reviews;
import FixItNow.model.Users;
import FixItNow.repository.BookingRepository;
import FixItNow.repository.ReviewsRepository;
import FixItNow.repository.UsersRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReviewsManager {

    @Autowired
    private ReviewsRepository reviewsRepository;

    @Autowired
    private BookingRepository br;

    @Autowired
    private UsersRepository usersRepository;

    private final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    
 // Replace existing method in UsersManager
    public String generateNextReviewsId() {
        int max = 0;
        // load all users (lightweight for modest user counts). If you prefer, add a repository query to return only ids.
        for (Reviews u : reviewsRepository.findAll()) {
            String id = u.getId();
            if (id != null && id.startsWith("R")) {
                try {
                    int n = Integer.parseInt(id.substring(1));
                    if (n > max) max = n;
                } catch (NumberFormatException ignored) {
                    // ignore non-numeric suffixes
                }
            }
        }
        return "R" + (max + 1);
    }
    
    
    
    public List<Map<String, Object>> getAllReviewsSimple() {
        List<Reviews> reviews = reviewsRepository.findAll();
        if (reviews == null || reviews.isEmpty()) return Collections.emptyList();

        List<Map<String, Object>> out = new ArrayList<>(reviews.size());
        for (Reviews r : reviews) {
            Map<String, Object> m = new HashMap<>();
            m.put("rating", r.getRating());
            m.put("comment", r.getComment() != null ? r.getComment() : "");
            Users provider = r.getProvider();
            m.put("provider_id", provider != null ? provider.getId() : null);

            // <-- change: include customer name (instead of customer_id)
            Users customer = r.getCustomer();
            m.put("customer_name", customer != null ? customer.getName() : null);

            out.add(m);
        }
        return out;
    }
    
    @Transactional
    public Reviews createReview(String bookingId, String customerId, Integer rating, String comment) {
        if (bookingId == null || bookingId.isBlank()) throw new IllegalArgumentException("bookingId is required");
        if (customerId == null || customerId.isBlank()) throw new IllegalArgumentException("customerId is required");
        if (rating == null) throw new IllegalArgumentException("rating is required");
        if (rating < 1 || rating > 5) throw new IllegalArgumentException("rating must be between 1 and 5");

        Booking booking = br.findById(bookingId).orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        Users customer = usersRepository.findById(customerId).orElseThrow(() -> new IllegalArgumentException("Customer not found"));

        // ensure the customer is the same as the booking's customer
        if (booking.getCustomer() == null || booking.getCustomer().getId() == null
                || !booking.getCustomer().getId().equals(customer.getId())) {
            throw new IllegalArgumentException("Only the booking's customer may create a review for this booking");
        }

        Users provider = booking.getProvider();
        if (provider == null) throw new IllegalArgumentException("Booking has no provider");

        Reviews review = new Reviews();
        review.setId(generateNextReviewsId());
        review.setBooking(booking);
        review.setCustomer(customer);
        review.setProvider(provider);
        review.setRating(rating);
        review.setComment(comment == null ? "" : comment);

        return reviewsRepository.save(review);
    }



    /**
     * Return a list of maps representing reviews for the provider.
     * Each map contains: reviewId, bookingId, customerName, customerEmail, rating, comment, createdAt
     */
    public List<Map<String, Object>> getReviewsForProvider(Users provider) {
        if (provider == null) return Collections.emptyList();
        List<Reviews> reviews = reviewsRepository.findByProvider(provider);
        return reviews.stream().map(this::toFrontendMap).collect(Collectors.toList());
    }

    /**
     * Return reviews written by a customer.
     */
    public List<Map<String, Object>> getReviewsForCustomer(Users customer) {
        if (customer == null) return Collections.emptyList();
        List<Reviews> reviews = reviewsRepository.findByCustomer(customer);
        return reviews.stream().map(this::toFrontendMap).collect(Collectors.toList());
    }

    /**
     * Return reviews for a booking id (empty if none)
     */
    public List<Map<String, Object>> getReviewsForBooking(String bookingId) {
        if (bookingId == null || bookingId.isBlank()) return Collections.emptyList();
        Booking booking = br.findById(bookingId).orElse(null);
        if (booking == null) return Collections.emptyList();
        List<Reviews> reviews = reviewsRepository.findByBooking(booking);
        return reviews.stream().map(this::toFrontendMap).collect(Collectors.toList());
    }

    private Map<String, Object> toFrontendMap(Reviews r) {
        Map<String, Object> m = new HashMap<>();
        m.put("reviewId", r.getId());
        if (r.getBooking() != null) m.put("bookingId", r.getBooking().getId());
        Users c = r.getCustomer();
        if (c != null) {
            m.put("customerName", c.getName());
            m.put("customerEmail", c.getEmail());
            // adapt phone getter if Users uses a different name
            try { m.put("customerPhone", c.getPhno()); } catch (Throwable t) { m.put("customerPhone", null); }
        }
        m.put("rating", r.getRating());
        m.put("comment", r.getComment());
        if (r.getCreatedAt() != null) m.put("createdAt", r.getCreatedAt().format(ISO));
        return m;
    }
}