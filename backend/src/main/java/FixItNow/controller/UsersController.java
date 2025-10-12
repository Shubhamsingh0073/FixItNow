package FixItNow.controller;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;

import FixItNow.manager.UsersManager;
import FixItNow.model.UserRole;
import FixItNow.model.Users;
import FixItNow.repository.UsersRepository;

@CrossOrigin(origins = "*")


@RestController
@RequestMapping("/users")
public class UsersController {

    @Autowired
    private UsersRepository userRepository;
    
    @Autowired
    private UsersManager usersManager;

    @PostMapping("/signin")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> loginData) {
        String email = loginData.get("email");
        String password = loginData.get("password");
        String roleString = loginData.get("role"); // Expecting "CUSTOMER", "PROVIDER", "ADMIN"
        
        // Convert role string to enum
        UserRole role = null;
        try {
            role = UserRole.valueOf(roleString.toUpperCase());
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
}