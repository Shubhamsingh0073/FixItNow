package FixItNow.controller;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import FixItNow.manager.UsersManager;
import FixItNow.model.Services;
import FixItNow.model.UserRole;
import FixItNow.model.Users;
import FixItNow.repository.ServicesRepository;
import FixItNow.repository.UsersRepository;

@CrossOrigin(origins = "*")


@RestController
@RequestMapping("/users")
public class UsersController {

	
	@Autowired
    private ServicesRepository servicesRepository;
	@Autowired
    private UsersRepository usersRepository;
    @Autowired
    private UsersManager usersManager;
    @PostMapping("/signin")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> loginData) {
        String email = loginData.get("email");
        String password = loginData.get("password");
        String roleString = loginData.get("role"); // Expecting "CUSTOMER", "PROVIDER", "ADMIN"
        
        try {
            UserRole.valueOf(roleString.toUpperCase());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Invalid role"));
        }

        // Find user by email
        String result = usersManager.validateCredentials(email, password);

        // Check for user, password and role match
        if (result.startsWith("200::")) {
            Map<String, String> response = new HashMap<>();
            response.put("token", result.substring(5));
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Invalid email, password, or role"));
        }
    }
    
    @PostMapping("/signup")
    public ResponseEntity<?> signupUser(@RequestBody Map<String, String> signupData) {
        String name = signupData.get("name"); // Now expecting "name" from frontend
        String email = signupData.get("email");
        String password = signupData.get("password");
        String roleString = signupData.get("role"); // Expecting "CUSTOMER", "PROVIDER", "ADMIN"
        
        // Convert role string to enum
        UserRole role = null;
        try {
            role = UserRole.valueOf(roleString.toUpperCase());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", "Invalid role"));
        }


        // Create new user
        Users newUser = new Users();
        newUser.setName(name);
        newUser.setEmail(email);
        newUser.setPassword(password);
        newUser.setRole(role);

        String result = usersManager.AddUsers(newUser);

        // Check if user already exists
        if (result.startsWith("401::")) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Collections.singletonMap("message", "Email already registered"));
        } else {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Collections.singletonMap("message", "User registered successfully"));
        }
    }
    
    // GET /users/me
    @GetMapping("/me")
    public ResponseEntity<?> getUserProfile(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Missing or invalid Authorization header"));
        }
        String token = authHeader.substring(7); // Remove "Bearer "

        String email = usersManager.validateToken(token);
        if ("401".equals(email)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Token expired or invalid"));
        }

        Users user = usersManager.getUserByEmail(email);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Collections.singletonMap("message", "User not found"));
        }
        Map<String, String> response = new HashMap<>();
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhno()); // or user.getPhone()
        return ResponseEntity.ok(response);
    }
    
    
    @PutMapping("/me/phone")
    public ResponseEntity<?> updatePhone(@RequestHeader("Authorization") String authHeader, @RequestBody Map<String, String> data) {
        String token = authHeader.substring(7);
        String email = usersManager.validateToken(token);
        if ("401".equals(email)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Collections.singletonMap("message", "Token expired or invalid"));
        }
        String phone = data.get("phone");
        usersManager.updatePhone(email, phone);
        return ResponseEntity.ok(Collections.singletonMap("message", "Phone updated successfully"));
    }
    
    @PutMapping("/me/location")
    public ResponseEntity<?> updateLocation(@RequestHeader("Authorization") String authHeader, @RequestBody Map<String, String> data) {
        String token = authHeader.substring(7);
        String email = usersManager.validateToken(token);
        if ("401".equals(email)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Collections.singletonMap("message", "Token expired or invalid"));
        }
        Users user = usersManager.getUserByEmail(email);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Collections.singletonMap("message", "User not found"));
        }

        // Update location
        String location = data.get("location");
        if (location == null || location.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Collections.singletonMap("message", "Location is required"));
        }
        user.setLocation(location);

        usersRepository.save(user); // or usersRepository.save(user);
        return ResponseEntity.ok(Collections.singletonMap("message", "Location updated successfully"));
    }
    
    
    @GetMapping("/providers")
    public ResponseEntity<?> getAllProviderProfiles() {
        // Get all users with role PROVIDER
        List<Users> providers = usersRepository.findByRole(UserRole.PROVIDER);

        // For each provider, get their service details
        List<Map<String, Object>> responseList = new ArrayList<>();
        for (Users user : providers) {
            Map<String, Object> profile = new HashMap<>();
            profile.put("id", user.getId()); // or user.getId()
            profile.put("name", user.getName());
            profile.put("location", user.getLocation());
            profile.put("phone", user.getPhno());
            profile.put("email", user.getEmail());

            // Fetch their service details (assuming one service per provider)
            List<Services> servicesList = servicesRepository.findByProvider(user);
            Services service = (servicesList != null && !servicesList.isEmpty()) ? servicesList.get(0) : null;

            if (service != null) {
                profile.put("description", service.getDescription());
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    Map<String, String> availability =
                        mapper.readValue(service.getAvailability(), new TypeReference<Map<String, String>>() {});
                    profile.put("availability", availability);
                } catch (Exception e) {
                    profile.put("availability", new HashMap<>());
                }
            } else {
                profile.put("description", "");
                profile.put("availability", new HashMap<>());
            }

            responseList.add(profile);
        }
        return ResponseEntity.ok(responseList);
    }
 
  
}