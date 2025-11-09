package FixItNow.manager;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import FixItNow.model.Booking;
import FixItNow.model.BookingStatus;
import FixItNow.model.Services;
import FixItNow.model.Users;
import FixItNow.repository.BookingRepository;
import FixItNow.repository.ServicesRepository;
import FixItNow.repository.UsersRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class BookingManager {

    @Autowired
    private BookingRepository br;

    @Autowired
    private ServicesRepository servicesRepository;

    @Autowired
    private UsersRepository usersRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    /*Generate the next booking id based on the repository's maximum id.*/
 // Replace existing method in UsersManager
    public String generateNextBookingId() {
        int max = 0;
        // load all users (lightweight for modest user counts). If you prefer, add a repository query to return only ids.
        for (Booking u : br.findAll()) {
            String id = u.getId();
            if (id != null && id.startsWith("B")) {
                try {
                    int n = Integer.parseInt(id.substring(1));
                    if (n > max) max = n;
                } catch (NumberFormatException ignored) {
                    // ignore non-numeric suffixes
                }
            }
        }
        return "B" + (max + 1);
    }
    
    
    @Transactional
    public Booking createBooking(String providerId, String customerId, LocalDate bookingDate, String timeSlot, Object bookedServiceObj) {
        if (providerId == null || providerId.isBlank()) throw new IllegalArgumentException("providerId required");
        if (customerId == null || customerId.isBlank()) throw new IllegalArgumentException("customerId required");
        if (bookingDate == null) throw new IllegalArgumentException("bookingDate required");
        if (timeSlot == null || timeSlot.isBlank()) throw new IllegalArgumentException("timeSlot required");

        Users provider = usersRepository.findById(providerId).orElseThrow(() -> new IllegalArgumentException("provider not found"));
        Users customer = usersRepository.findById(customerId).orElseThrow(() -> new IllegalArgumentException("customer not found"));

        // find first service for provider
        List<Services> servicesList = servicesRepository.findByProvider(provider);
        if (servicesList == null || servicesList.isEmpty()) {
            throw new IllegalArgumentException("no service found for provider");
        }
        Services service = servicesList.get(0);

        Booking booking = new Booking();
        booking.setId(generateNextBookingId());
        booking.setService(service);
        booking.setProvider(provider);
        booking.setCustomer(customer);

        // serialize bookedService object to JSON string for booked_service column
        try {
            String bookedJson = objectMapper.writeValueAsString(bookedServiceObj == null ? new Object() : bookedServiceObj);
            booking.setBookedService(bookedJson);
        } catch (JsonProcessingException e) {
            // fallback to simple toString if serialization fails
            booking.setBookedService(bookedServiceObj == null ? "{}" : bookedServiceObj.toString());
        }

        booking.setBookingDate(bookingDate);
        booking.setTimeSlot(timeSlot);

        // set status to pending when customer requests connection
        booking.setStatus(BookingStatus.PENDING);

        return br.save(booking);
    }

    /**
     * Convenience wrapper that accepts bookingDate as ISO string (yyyy-MM-dd).
     */
    public Booking createBookingFromPayload(String providerId, String customerId, String bookingDateStr, String timeSlot, Object bookedServiceObj) {
        LocalDate date;
        try {
            date = LocalDate.parse(bookingDateStr); // expects yyyy-MM-dd
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid bookingDate. Use yyyy-MM-dd");
        }
        return createBooking(providerId, customerId, date, timeSlot, bookedServiceObj);
    }
    
    
    public List<Map<String, Object>> getBookingsForProvider(Users provider) {
        if (provider == null) return Collections.emptyList();

        List<Booking> bookings = br.findByProvider(provider);
        if (bookings == null || bookings.isEmpty()) return Collections.emptyList();

        List<Map<String, Object>> out = new ArrayList<>(bookings.size());

        for (Booking b : bookings) {
            Map<String, Object> item = new HashMap<>();

            // customer info from users table
            Users customer = b.getCustomer();
            if (customer != null) {
                // Adjust getter names if your Users entity uses different method names
                item.put("customerName", customer.getName() != null ? customer.getName() : "");
                item.put("customerEmail", customer.getEmail() != null ? customer.getEmail() : "");
                // phone getter used in other places was getPhno()
                String phone = null;
                try {
                    phone = customer.getPhno();
                } catch (Throwable t) {
                    // fallback if method name differs
                    try { phone = customer.getPhno(); } catch (Throwable t2) { phone = null; }
                }
                item.put("customerPhone", phone != null ? phone : "");
                item.put("customerLocation", customer.getLocation() != null ? customer.getLocation() : "");
            } else {
                item.put("customerName", "");
                item.put("customerEmail", "");
                item.put("customerPhone", "");
                item.put("customerLocation", "");
            }

            // booked services stored as JSON string in booking.booked_service
            String bookedJson = b.getBookedService();
            if (bookedJson == null || bookedJson.trim().isEmpty()) {
                item.put("bookedServices", Collections.emptyMap());
            } else {
                try {
                    // deserialize into Map so frontend receives structured JSON
                    Map<String, Object> bookedMap = objectMapper.readValue(bookedJson, new TypeReference<Map<String, Object>>() {});
                    item.put("bookedServices", bookedMap);
                } catch (Exception e) {
                    // fallback: return raw string under a map key "raw"
                    Map<String, Object> fallback = new HashMap<>();
                    fallback.put("raw", bookedJson);
                    item.put("bookedServices", fallback);
                }
            }

            
            // booking date and time slot
            if (b.getBookingDate() != null) {
                item.put("bookingDate", b.getBookingDate().toString()); // yyyy-MM-dd
            } else {
                item.put("bookingDate", "");
            }
            item.put("timeSlot", b.getTimeSlot() != null ? b.getTimeSlot() : "");
            item.put("bookingId", b.getId() != null ? b.getId() : "");
            
            
            try {
                item.put("status", b.getStatus() != null ? b.getStatus().name() : "");
            } catch (Throwable t) {
                // safe fallback
                item.put("status", "");
            }

            

            out.add(item);
        }
        
        return out;
    }
    
    
    public List<Map<String, Object>> getBookingsForCustomer(Users customer) {
        if (customer == null) return Collections.emptyList();

        List<Booking> bookings = br.findByCustomer(customer);
        if (bookings == null || bookings.isEmpty()) return Collections.emptyList();

        List<Map<String, Object>> out = new ArrayList<>(bookings.size());

        for (Booking b : bookings) {
            Map<String, Object> item = new HashMap<>();

            // booking id, date, time slot
            item.put("bookingId", b.getId() != null ? b.getId() : "");
            item.put("bookingDate", b.getBookingDate() != null ? b.getBookingDate().toString() : "");
            item.put("timeSlot", b.getTimeSlot() != null ? b.getTimeSlot() : "");

            // booked services: stored as JSON string in booked_service column
            String bookedJson = b.getBookedService();
            if (bookedJson == null || bookedJson.trim().isEmpty() || "{}".equals(bookedJson.trim())) {
                item.put("bookedServices", Collections.emptyMap());
            } else {
                try {
                    Map<String, Object> bookedMap = objectMapper.readValue(bookedJson, new TypeReference<Map<String, Object>>() {});
                    item.put("bookedServices", bookedMap);
                } catch (Exception e) {
                    // fallback: return raw string under key "raw"
                    Map<String, Object> fallback = new HashMap<>();
                    fallback.put("raw", bookedJson);
                    item.put("bookedServices", fallback);
                }
            }

            // status
            try {
                item.put("status", b.getStatus() != null ? b.getStatus().name() : "");
            } catch (Throwable t) {
                item.put("status", "");
            }

            // optionally include providerId (useful on frontend) - comment out if not wanted
            if (b.getProvider() != null) {
                item.put("providerId", b.getProvider().getId());
            }

            out.add(item);
        }
        
        return out;
    }


    /**
     * Find booking by id.
     */
    public Optional<Booking> findById(String id) {
        return br.findById(id);
    }

    /**
     * Update booking status by string and persist.
     * Throws IllegalArgumentException on invalid status or if booking not found.
     */
    @Transactional
    public Booking updateBookingStatusByString(String bookingId, String statusStr) {
        if (bookingId == null || bookingId.isBlank()) throw new IllegalArgumentException("bookingId is required");
        if (statusStr == null || statusStr.isBlank()) throw new IllegalArgumentException("status is required");

        Booking booking = br.findById(bookingId).orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        BookingStatus statusEnum;
        try {
            statusEnum = BookingStatus.valueOf(statusStr.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            StringBuilder allowed = new StringBuilder();
            for (BookingStatus bs : BookingStatus.values()) {
                if (allowed.length() > 0) allowed.append(", ");
                allowed.append(bs.name());
            }
            throw new IllegalArgumentException("Invalid status. Allowed values: " + allowed.toString());
        }

        booking.setStatus(statusEnum);
        return br.save(booking);
    }
}