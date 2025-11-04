package FixItNow.controller;

import FixItNow.manager.*;
import FixItNow.model.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/bookings")
public class BookingController {

    @Autowired
    private BookingManager bookingManager;
    
    @Autowired
    private UsersManager usersManager;

    @PostMapping("/create")
    public ResponseEntity<?> createBooking(
             @RequestHeader(value = "Authorization", required = false) String authHeader,
             @RequestBody Map<String, Object> payload) {
        try {
            
             // Validate Authorization header
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Collections.singletonMap("message", "Missing or invalid Authorization header"));
            }
            String token = authHeader.substring(7);

            // Validate token and get email
            String email = usersManager.validateToken(token);
            if ("401".equals(email)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Collections.singletonMap("message", "Token expired or invalid"));
            }

            // Get authenticated user (customer)
            Users customer = usersManager.getUserByEmail(email);
            if (customer == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("message", "Authenticated user not found"));
            }
        
            String providerId = payload.get("providerId") != null ? payload.get("providerId").toString() : null;
            String bookingDate = payload.get("bookingDate") != null ? payload.get("bookingDate").toString() : null;
            String timeSlot = payload.get("timeSlot") != null ? payload.get("timeSlot").toString() : null;
            Object bookedService = payload.get("bookedServices");

            // Read optional status from frontend payload (e.g., "PENDING", "CONFIRMED", "COMPLETED", etc.)
            String statusFromPayload = payload.get("status") != null ? payload.get("status").toString() : null;

            String customerId = (customer.getId() != null && !customer.getId().isBlank()) ? customer.getId() : customer.getId();

            
            Booking created = bookingManager.createBookingFromPayload(providerId, customerId, bookingDate, timeSlot, bookedService);

            // If frontend provided a status, persist it to the booking's status column.
            if (statusFromPayload != null && !statusFromPayload.isBlank()) {
                try {
                    // reuse existing manager method to validate and persist the status
                    bookingManager.updateBookingStatusByString(created.getId(), statusFromPayload);
                } catch (IllegalArgumentException iae) {
                    // status value invalid — return 400 with message
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Collections.singletonMap("message", iae.getMessage()));
                } catch (Exception e) {
                    // unexpected error while saving status
                    e.printStackTrace();
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Collections.singletonMap("message", "Failed to save booking status"));
                }
            }

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Collections.singletonMap("bookingId", created.getId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Collections.singletonMap("message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.singletonMap("message", "Failed to create booking"));
        }
    }
    
    @GetMapping("/provider/me")
    public ResponseEntity<?> getBookingsForAuthenticatedProvider(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        // Validate Authorization header
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Missing or invalid Authorization header"));
        }
        String token = authHeader.substring(7);

        // Validate token and obtain email using same pattern as ServicesController
        String email = usersManager.validateToken(token);
        if ("401".equals(email)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Token expired or invalid"));
        }

        Users provider = usersManager.getUserByEmail(email);
        if (provider == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("message", "Authenticated provider not found"));
        }

        // Fetch and return bookings for this provider
        List<Map<String, Object>> bookings = bookingManager.getBookingsForProvider(provider);
        return ResponseEntity.ok(bookings);
    }
    
    
    
    @GetMapping("/customer/me")
    public ResponseEntity<?> getBookingsForAuthenticatedCustomer(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        // Validate Authorization header
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Missing or invalid Authorization header"));
        }
        String token = authHeader.substring(7);

        // Validate token and get email
        String email = usersManager.validateToken(token);
        if ("401".equals(email)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Token expired or invalid"));
        }

        Users customer = usersManager.getUserByEmail(email);
        if (customer == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("message", "Authenticated user not found"));
        }

        List<Map<String, Object>> bookings = bookingManager.getBookingsForCustomer(customer);
        return ResponseEntity.ok(bookings);
    }
    
    
    @PostMapping("/status")
    public ResponseEntity<?> updateBookingStatus(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> payload
    ) {
        // Basic header validation
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Missing or invalid Authorization header"));
        }
        String token = authHeader.substring(7);

        // Validate token and get email
        String email = usersManager.validateToken(token);
        if ("401".equals(email)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Token expired or invalid"));
        }

        Users authUser = usersManager.getUserByEmail(email);
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("message", "Authenticated user not found"));
        }

        // Read payload (no extra DTO as requested)
        String bookingId = payload.get("bookingId") != null ? payload.get("bookingId").toString() : null;
        String status = payload.get("status") != null ? payload.get("status").toString() : null;

        // <<-- NEW: validate bookingId and status BEFORE calling repository/manager to avoid server errors
        if (bookingId == null || bookingId.isBlank()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "bookingId is required"));
        }
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", "status is required"));
        }

        // debug log to help trace server-side issues (remove or replace with real logger in prod)
        System.out.println("updateBookingStatus called by user=" + authUser.getId() + " bookingId=" + bookingId + " status=" + status);

        try {
            // Verify booking exists
            Optional<Booking> opt = bookingManager.findById(bookingId);
            if (opt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Collections.singletonMap("message", "Booking not found"));
            }
            Booking booking = opt.get();

            // Authorization: only provider of this booking can update status
            Users provider = booking.getProvider();
            if (provider == null || !provider.getId().equals(authUser.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Collections.singletonMap("message", "Not allowed to update this booking"));
            }

            // Delegate to manager (will validate status string)
            Booking updated = bookingManager.updateBookingStatusByString(bookingId, status);

            return ResponseEntity.ok(Collections.singletonMap("message", "Booking status updated"));
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", iae.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("message", "Failed to update booking status"));
        }
    }
    
}