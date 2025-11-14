package FixItNow.controller;

import FixItNow.manager.ServicesManager;
import FixItNow.manager.UsersManager;
import FixItNow.model.Services;
import FixItNow.model.ServicesVerified;
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
import java.util.Optional;

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
        Services service = servicesList.get(0);
        
        ObjectMapper mapper = new ObjectMapper();

        Map<String, Object> response = new HashMap<>();
        response.put("description", service.getDescription());
        try {
        	
        	Map<String, String> availability = mapper.readValue(service.getAvailability(), new TypeReference<Map<String, String>>() {});
            response.put("availability", availability);
        } catch (Exception e) {
            response.put("availability", new HashMap<>());
        }
        
        response.put("category", service.getCategory());

        try {
            String subJson = service.getSubcategory();
            if (subJson == null || subJson.trim().isEmpty()) {
                response.put("subcategories", new HashMap<>());
            } else {
                Map<String, Object> subMap = mapper.readValue(subJson, new TypeReference<Map<String, Object>>() {});
                response.put("subcategories", subMap);
            }
        } catch (Exception e) {
            response.put("subcategories", new HashMap<>());
        }
        
        
        return ResponseEntity.ok(response);
    }
    
    
    @PutMapping("/{id}/verify")
    public ResponseEntity<?> updateServiceVerified(
            @PathVariable("id") String id,
            @RequestBody Map<String, Object> body) {

        Object verifiedObj = body.get("verified");
        if (verifiedObj == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Missing 'verified' in body"));
        }

        Optional<Services> opt = servicesRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Services service = opt.get();

        ServicesVerified newStatus;
        if (verifiedObj instanceof Boolean) {
            boolean b = (Boolean) verifiedObj;
            newStatus = b ? ServicesVerified.APPROVED : ServicesVerified.REJECTED;
        } else {
            try {
                newStatus = ServicesVerified.valueOf(String.valueOf(verifiedObj).toUpperCase());
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid verified value"));
            }
        }

        service.setVerified(newStatus);
        servicesRepository.save(service);

        return ResponseEntity.ok(Map.of("id", id, "verified", newStatus.name()));
    }
    
    
}