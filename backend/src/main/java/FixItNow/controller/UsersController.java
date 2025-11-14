package FixItNow.controller;

import java.time.format.DateTimeFormatter;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ContentDisposition;

import FixItNow.model.ProviderDocument;
import FixItNow.repository.ProviderDocumentRepository;
import FixItNow.manager.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;

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

	    @Autowired
	    private ProviderDocumentRepository providerDocumentRepository;

	    @Autowired
	    private FileStorageService fileStorageService;

	    private static final long MAX_BYTES = 5L * 1024L * 1024L; // 5MB
	    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

	    @PostMapping("/signin")
	    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> loginData) {
	        String email = loginData.get("email");
	        String password = loginData.get("password");
	        String roleString = loginData.get("role"); 

	        UserRole requestedRole = null;
	        try {
	            requestedRole = UserRole.valueOf(roleString.toUpperCase());
	        } catch (Exception e) {
	            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
	                    .body(Collections.singletonMap("message", "Invalid role"));
	        }

	        // 1) Check email exists
	        Users user = usersManager.getUserByEmail(email);
	        if (user == null) {
	            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
	                    .body(Collections.singletonMap("message", "Invalid email"));
	        }

	        // 2) Check password
	        String storedPassword = user.getPassword();
	        if (storedPassword == null || !storedPassword.equals(password)) {
	            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
	                    .body(Collections.singletonMap("message", "Invalid password"));
	        }

	        // 3) Check role matches the requested role
	        if (user.getRole() == null || user.getRole() != requestedRole) {
	            return ResponseEntity.status(HttpStatus.FORBIDDEN)
	                    .body(Collections.singletonMap("message", "Invalid role for this user"));
	        }

	        // Credentials validated — obtain token as before
	        String result = usersManager.validateCredentials(email, password);
	        if (!result.startsWith("200::")) {
	            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
	                    .body(Collections.singletonMap("message", "Authentication failed"));
	        }

	        String token = result.substring(5);
	        Map<String, String> response = new HashMap<>();
	        response.put("token", token);

	        if (requestedRole == UserRole.PROVIDER) {
	            try {
	                List<Services> servicesList = servicesRepository.findByProvider(user);
	                if (servicesList != null && !servicesList.isEmpty()) {
	                    Services service = servicesList.get(0);
	                    if (service != null && service.getVerified() != null) {
	                        response.put("verified", service.getVerified().name());
	                    } else {
	                        response.put("verified", "PENDING");
	                    }
	                } else {
	                    // no service found for provider - default to PENDING
	                    response.put("verified", "PENDING");
	                }
	            } catch (Exception e) {
	                response.put("verified", "PENDING");
	            }
	        }

	        return ResponseEntity.ok(response);
	    }

	    
	    @PostMapping("/signup")
	    public ResponseEntity<?> signupUser(@RequestBody Map<String, String> signupData) {
	        String name = signupData.get("name"); 
	        String email = signupData.get("email");
	        String password = signupData.get("password");
	        String roleString = signupData.get("role"); 

	        UserRole role = null;
	        try {
	            role = UserRole.valueOf(roleString.toUpperCase());
	        } catch (Exception e) {
	            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
	                    .body(Collections.singletonMap("message", "Invalid role"));
	        }

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
	            // Fetch saved user to return id 
	            Users saved = usersManager.getUserByEmail(email);
	            Map<String, String> resp = new HashMap<>();
	            resp.put("message", "User registered successfully");
	            if (saved != null && saved.getId() != null) {
	                resp.put("userId", saved.getId());
	            }
	            return ResponseEntity.status(HttpStatus.CREATED)
	                    .body(resp);
	        }
	    }

	  
	    @PostMapping(value = "/{providerId}/document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	    public ResponseEntity<?> uploadProviderDocument(
	            @PathVariable String providerId,
	            @RequestPart("file") MultipartFile file
	    ) {
	        try {
	            if (file == null || file.isEmpty()) {
	                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "No file uploaded"));
	            }

	            Users provider = usersRepository.findById(providerId).orElse(null);
	            if (provider == null) {
	                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("message", "Provider not found"));
	            }

	            String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
	            String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
	            if (!(contentType.equals("application/pdf") || original.endsWith(".pdf"))) {
	                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "Only PDF files are allowed"));
	            }
	            if (file.getSize() > MAX_BYTES) {
	                return ResponseEntity.badRequest().body(Collections.singletonMap("message", "File too large. Max 5MB"));
	            }

	            String subfolder = "providers/" + providerId;
	            String storedPath;
	            try {
	                storedPath = fileStorageService.store(file, subfolder, "license");
	            } catch (IllegalArgumentException iae) {
	                return ResponseEntity.badRequest().body(Collections.singletonMap("message", iae.getMessage()));
	            } catch (Exception e) {
	                e.printStackTrace();
	                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.singletonMap("message", "Failed to store file"));
	            }

	            ProviderDocument doc = new ProviderDocument();
	            doc.setId("D" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
	            doc.setProvider(provider);
	            doc.setFilename(file.getOriginalFilename());
	            doc.setStoragePath(storedPath);
	            providerDocumentRepository.save(doc);

	            Map<String, String> resp = new HashMap<>();
	            resp.put("message", "Document uploaded");
	            resp.put("documentId", doc.getId());
	            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
	        } catch (Exception e) {
	            e.printStackTrace();
	            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.singletonMap("message", "Upload failed"));
	        }
	    }

	   
	    @GetMapping("/documents")
	    public ResponseEntity<?> getAllProviderDocuments() {
	        try {
	            List<ProviderDocument> docs = providerDocumentRepository.findAll();
	            List<Map<String, Object>> out = new ArrayList<>(docs.size());
	            for (ProviderDocument d : docs) {
	                Map<String, Object> m = new HashMap<>();
	                m.put("document_id", d.getId());
	                m.put("provider_id", d.getProvider() != null ? d.getProvider().getId() : null);
	                m.put("filename", d.getFilename());
	                m.put("uploadedAt", d.getUploadedAt() != null ? d.getUploadedAt().format(ISO) : null);
	                out.add(m);
	            }
	            return ResponseEntity.ok(out);
	        } catch (Exception e) {
	            e.printStackTrace();
	            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Collections.singletonMap("message", "Failed to fetch documents"));
	        }
	    }
	    
	    
	    @GetMapping("/document/{documentId}")
	    public ResponseEntity<?> streamDocumentById(@PathVariable String documentId) {
	        try {
	            Optional<ProviderDocument> opt = providerDocumentRepository.findById(documentId);
	            if (opt.isEmpty()) {
	                return ResponseEntity.status(HttpStatus.NOT_FOUND)
	                        .body(Collections.singletonMap("message", "Document not found"));
	            }

	            ProviderDocument doc = opt.get();
	            Resource resource = fileStorageService.loadAsResource(doc.getStoragePath());
	            if (resource == null) {
	                return ResponseEntity.status(HttpStatus.NOT_FOUND)
	                        .body(Collections.singletonMap("message", "File not found on server"));
	            }

	            HttpHeaders headers = new HttpHeaders();
	            headers.setContentType(MediaType.APPLICATION_PDF);
	            headers.setContentDisposition(ContentDisposition.inline().filename(doc.getFilename()).build());
	            return new ResponseEntity<>(resource, headers, HttpStatus.OK);
	        } catch (Exception e) {
	            e.printStackTrace();
	            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                    .body(Collections.singletonMap("message", "Failed to stream document"));
	        }
	    }

	    
	    @GetMapping("/document/provider/{providerId}")
	    public ResponseEntity<?> streamDocumentByProvider(@PathVariable String providerId) {
	        try {
	            Users provider = usersRepository.findById(providerId).orElse(null);
	            if (provider == null) {
	                return ResponseEntity.status(HttpStatus.NOT_FOUND)
	                        .body(Collections.singletonMap("message", "Provider not found"));
	            }

	            Optional<ProviderDocument> opt = providerDocumentRepository.findByProvider(provider);
	            if (opt.isEmpty()) {
	                return ResponseEntity.status(HttpStatus.NOT_FOUND)
	                        .body(Collections.singletonMap("message", "Document not found for provider"));
	            }

	            ProviderDocument doc = opt.get();
	            Resource resource = fileStorageService.loadAsResource(doc.getStoragePath());
	            if (resource == null) {
	                return ResponseEntity.status(HttpStatus.NOT_FOUND)
	                        .body(Collections.singletonMap("message", "File not found on server"));
	            }

	            HttpHeaders headers = new HttpHeaders();
	            headers.setContentType(MediaType.APPLICATION_PDF);
	            headers.setContentDisposition(ContentDisposition.inline().filename(doc.getFilename()).build());
	            return new ResponseEntity<>(resource, headers, HttpStatus.OK);
	        } catch (Exception e) {
	            e.printStackTrace();
	            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
	                    .body(Collections.singletonMap("message", "Failed to stream document"));
	        }
	    }
	    
    
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
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("phone", user.getPhno());
        return ResponseEntity.ok(response);
    }
    
    
    @GetMapping("/customers")
    public List<Users> getAllCustomers() {
        return usersRepository.findByRole(UserRole.CUSTOMER);
    }
    
    
    @GetMapping("/locations")
    public ResponseEntity<?> getAllUserLocations() {
        try {
            List<Users> users = usersRepository.findAll();
            List<Map<String, String>> out = new ArrayList<>(users.size());
            for (Users u : users) {
                Map<String, String> m = new HashMap<>();
                m.put("id", u.getId());
                m.put("location", u.getLocation() == null ? "" : u.getLocation());
                out.add(m);
            }
            return ResponseEntity.ok(out);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("message", "Failed to fetch user locations"));
        }
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

        String location = data.get("location");
        if (location == null || location.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Collections.singletonMap("message", "Location is required"));
        }
        user.setLocation(location);

        usersRepository.save(user); 
        return ResponseEntity.ok(Collections.singletonMap("message", "Location updated successfully"));
    }
    
    
    @GetMapping("/providers")
    public ResponseEntity<?> getAllProviderProfiles() {
        List<Users> providers = usersRepository.findByRole(UserRole.PROVIDER);

        List<Map<String, Object>> responseList = new ArrayList<>();
        for (Users user : providers) {
            Map<String, Object> profile = new HashMap<>();
            profile.put("id", user.getId()); 
            profile.put("name", user.getName());
            profile.put("location", user.getLocation());
            profile.put("phone", user.getPhno());
            profile.put("email", user.getEmail());

            ObjectMapper mapper = new ObjectMapper();
            
            List<Services> servicesList = servicesRepository.findByProvider(user);
            if (servicesList != null && !servicesList.isEmpty()) {
                Services service = servicesList.get(0);

                profile.put("description", service.getDescription() == null ? "" : service.getDescription());

                try {
                    String availJson = service.getAvailability();
                    if (availJson == null || availJson.trim().isEmpty()) {
                        profile.put("availability", new HashMap<String, Object>());
                    } else {
                        Map<String, Object> availability = mapper.readValue(availJson, new TypeReference<Map<String, Object>>() {});
                        profile.put("availability", availability);
                    }
                } catch (Exception e) {
                    profile.put("availability", new HashMap<String, Object>());
                }

                profile.put("category", service.getCategory() == null ? "" : service.getCategory());
                profile.put("verified", service.getVerified() == null ? "" : service.getVerified());

                try {
                    String subJson = service.getSubcategory();
                    if (subJson == null || subJson.trim().isEmpty()) {
                        profile.put("subcategory", new HashMap<String, Object>());
                    } else {
                        Map<String, Object> subMap = mapper.readValue(subJson, new TypeReference<Map<String, Object>>() {});
                        profile.put("subcategory", subMap);
                    }
                } catch (Exception e) {
                    profile.put("subcategory", new HashMap<String, Object>());
                }
            } else {
                profile.put("description", "");
                profile.put("availability", new HashMap<String, Object>());
                profile.put("category", "");
                profile.put("verifed", "");
                profile.put("subcategory", new HashMap<String, Object>());
            }

            responseList.add(profile);
        }
        return ResponseEntity.ok(responseList);
    }
    
    
    @PostMapping("/forgot/check")
    public ResponseEntity<?> checkEmailExists(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "email is required"));
            }
            Users user = usersManager.getUserByEmail(email.trim().toLowerCase());
            if (user == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
            // Optionally return minimal user info or just 200
            return ResponseEntity.ok(Map.of("exists", true, "id", user.getId()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Failed to check email"));
        }
    }

    // PUT /users/forgot/reset
    @PutMapping("/forgot/reset")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String newPassword = body.get("newPassword");
            if (email == null || email.trim().isEmpty() || newPassword == null || newPassword.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "email and newPassword are required"));
            }
            if (newPassword.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of("message", "Password must be at least 6 characters"));
            }

            Users user = usersManager.getUserByEmail(email.trim().toLowerCase());
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
            }

            // NOTE: In production you should hash passwords before storing.
            user.setPassword(newPassword);
            usersRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Password updated"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Failed to reset password"));
        }
    }
 
  
}