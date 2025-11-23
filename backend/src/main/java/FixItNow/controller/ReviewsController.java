package FixItNow.controller;

import FixItNow.manager.ReviewsManager;
import FixItNow.manager.UsersManager;
import FixItNow.model.Reviews;
import FixItNow.model.Users;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/reviews")
public class ReviewsController {

    @Autowired
    private ReviewsManager reviewsManager;

    @Autowired
    private UsersManager usersManager;


    @PostMapping("/create")
    public ResponseEntity<?> createReview(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> payload
    ) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Collections.singletonMap("message", "Missing or invalid Authorization header"));
            }
            String token = authHeader.substring(7);

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

            String bookingId = payload.get("bookingId") != null ? payload.get("bookingId").toString() : null;
            Integer rating = null;
            if (payload.get("rating") != null) {
                try {
                    rating = Integer.parseInt(payload.get("rating").toString());
                } catch (NumberFormatException ignored) {}
            }
            String comment = payload.get("comment") != null ? payload.get("comment").toString() : null;

            Reviews created = reviewsManager.createReview(bookingId, customer.getId(), rating, comment);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Collections.singletonMap("reviewId", created.getId()));
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("message", iae.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("message", "Failed to create review"));
        }
    }

   
    
    @GetMapping("/all")
    public ResponseEntity<List<Map<String, Object>>> getAllReviewsSimple() {
        List<Map<String, Object>> reviews = reviewsManager.getAllReviewsSimple();
        return ResponseEntity.ok(reviews);
    }

}