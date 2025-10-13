package FixItNow.controller;

import FixItNow.manager.ServicesManager;
import FixItNow.manager.UsersManager;
import FixItNow.model.Services;
import FixItNow.model.Users;
import FixItNow.model.UserRole;
import FixItNow.repository.ServicesRepository;
import FixItNow.repository.UsersRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")

@RestController
@RequestMapping("/service")
public class ServicesController {

    @Autowired
    private ServicesRepository servicesRepository;
    @Autowired
    private UsersManager usersManager;
    @Autowired
    
    private ServicesManager servicesManager;
    @Autowired
    private UsersRepository usersRepository;

    // Get all services
    @GetMapping
    public List<Services> getAllServices() {
        return servicesRepository.findAll();
    }
    
    

    // Get services for a specific provider
    @GetMapping("/provider/{providerId}")
    public List<Services> getServicesByProvider(@PathVariable String providerId) {
        Users provider = usersRepository.findById(providerId).orElse(null);
        if (provider == null) {
            return List.of(); // or throw a 404
        }
        return servicesRepository.findByProvider(provider);
    }

    // Get all providers from users table (role="PROVIDER")
    @GetMapping("/providers")
    public List<Users> getAllProviders() {
        return usersRepository.findByRole(UserRole.PROVIDER);
    }
    
    @PutMapping("/me")
    public ResponseEntity<?> updateService(@RequestHeader("Authorization") String authHeader, @RequestBody Map<String, Object> data) {
        String token = authHeader.substring(7);
        String email = usersManager.validateToken(token);
        if ("401".equals(email)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Collections.singletonMap("message", "Token expired or invalid"));
        }
        Users provider = usersManager.getUserByEmail(email);
        servicesManager.updateServiceDetails(provider, data);
        return ResponseEntity.ok(Collections.singletonMap("message", "Service updated successfully"));
    }
    
    @GetMapping("/me")
    public ResponseEntity<?> getServiceDetails(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String email = usersManager.validateToken(token);
        if ("401".equals(email)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Collections.singletonMap("message", "Token expired or invalid"));
        }
        Users provider = usersManager.getUserByEmail(email);
        List<Services> servicesList = servicesRepository.findByProvider(provider);
        if (servicesList == null || servicesList.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Collections.singletonMap("message", "Service not found"));
        }
        // Assuming one service per provider, adjust if multiple
        Services service = servicesList.get(0);

        // If availability is stored as JSON string, parse it back to a Map
        Map<String, Object> response = new HashMap<>();
        response.put("description", service.getDescription());
        // If availability is stored as JSON string:
        try {
        	ObjectMapper mapper = new ObjectMapper();
        	Map<String, String> availability = mapper.readValue(service.getAvailability(), new TypeReference<Map<String, String>>() {});
            response.put("availability", availability);
        } catch (Exception e) {
            response.put("availability", new HashMap<>());
        }
        return ResponseEntity.ok(response);
    }
    
    
}