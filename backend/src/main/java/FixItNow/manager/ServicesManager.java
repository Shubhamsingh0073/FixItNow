package FixItNow.manager;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import FixItNow.model.Services;
import FixItNow.model.Users;
import FixItNow.repository.ServicesRepository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ServicesManager {

    @Autowired
    private ServicesRepository sr;
    
 // Replace existing method in UsersManager
    public String generateNextServiceId() {
        int max = 0;
        // load all users (lightweight for modest user counts). If you prefer, add a repository query to return only ids.
        for (Services u : sr.findAll()) {
            String id = u.getId();
            if (id != null && id.startsWith("S")) {
                try {
                    int n = Integer.parseInt(id.substring(1));
                    if (n > max) max = n;
                } catch (NumberFormatException ignored) {
                    // ignore non-numeric suffixes
                }
            }
        }
        return "S" + (max + 1);
    }
    

    @Transactional
    public Services createDefaultServiceForProvider(Users provider) {
        Services service = new Services();
        service.setId(generateNextServiceId());
        service.setProvider(provider); // links provider_id to users.id
        service.setCategory("Default Category");
        service.setSubcategory("Default Subcategory");
        service.setDescription("Default description for new provider");
        service.setAvailability("{\"Monday\": \"9-5\"}");
        return sr.save(service);
    }

    /*Update service details for the provider. */
    public void updateServiceDetails(Users provider, Map<String, Object> data) {
        if (provider == null) {
            throw new IllegalArgumentException("provider must not be null");
        }

        List<Services> servicesList = sr.findByProvider(provider);
        if (servicesList == null) {
            servicesList = new ArrayList<>();
        }

        // If no service exists for this provider, create one so we can store the incoming values
        if (servicesList.isEmpty()) {
            Services created = createDefaultServiceForProvider(provider);
            servicesList.add(created);
        }

        ObjectMapper mapper = new ObjectMapper();

        // Serialize availability if provided
        String availabilityJson = null;
        if (data.containsKey("availability")) {
            try {
                availabilityJson = mapper.writeValueAsString(data.get("availability"));
            } catch (JsonProcessingException e) {
                // fallback to empty object
                availabilityJson = "{}";
                e.printStackTrace();
            }
        }

        // Description
        String description = null;
        if (data.containsKey("description") && data.get("description") != null) {
            description = data.get("description").toString();
        }

        // Category (expecting a String)
        String category = null;
        if (data.containsKey("category") && data.get("category") != null) {
            category = data.get("category").toString();
        }

        Object subObj = null;
        if (data.containsKey("subcategory")) {
            subObj = data.get("subcategory");
        } else if (data.containsKey("Subcategories")) {
            subObj = data.get("Subcategories");
        }

        String subcategoryJson = null;
        if (subObj != null) {
            if (subObj instanceof String) {
                subcategoryJson = ((String) subObj).trim();
            } else {
                // Structured object/array -> serialize to JSON string
                try {
                    subcategoryJson = mapper.writeValueAsString(subObj);
                } catch (JsonProcessingException e) {
                    // on failure, fallback to empty JSON object
                    subcategoryJson = "{}";
                    e.printStackTrace();
                }
            }
        }

        // Update all services for this provider (keeps existing behavior of method)
        for (Services service : servicesList) {
            if (availabilityJson != null) {
                service.setAvailability(availabilityJson);
            }
            if (description != null) {
                service.setDescription(description);
            }
            if (category != null) {
                service.setCategory(category);
            }
            if (subcategoryJson != null) {
                service.setSubcategory(subcategoryJson);
            }
            sr.save(service);
        }
    }
}