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
import java.util.List;
import java.util.Map;

@Service
public class ServicesManager {

    @Autowired
    private ServicesRepository sr;

    public String generateNextServiceId() {
        String maxId = sr.findMaxServiceId(); // e.g., "S17"
        int nextNum = 1;
        if (maxId != null && maxId.startsWith("S")) {
            try {
                nextNum = Integer.parseInt(maxId.substring(1)) + 1;
            } catch (NumberFormatException e) {
                nextNum = 1;
            }
        }
        return "S" + nextNum;
    }

    @Transactional
    public Services createDefaultServiceForProvider(Users provider) {
        Services service = new Services();
        service.setId(generateNextServiceId()); 
        service.setProvider(provider); // links provider_id to users.id
        service.setCategory("Default Category");
        service.setSubcategory("Default Subcategory");
        service.setDescription("Default description for new provider");
        service.setPrice(new BigDecimal("0.00"));
        service.setAvailability("{\"Monday\": \"9-5\"}");
        return sr.save(service);
    }
    
    public void updateServiceDetails(Users provider, Map<String, Object> data) {
        List<Services> servicesList = sr.findByProvider(provider);
        if (servicesList != null && !servicesList.isEmpty()) {
            ObjectMapper mapper = new ObjectMapper();
            String availabilityJson = "";
            try {
                availabilityJson = mapper.writeValueAsString(data.get("availability"));
            } catch (JsonProcessingException e) {
                // Handle error, e.g. log and/or set a default value
                availabilityJson = "{}";
                e.printStackTrace();
            }
            for (Services service : servicesList) {
                service.setAvailability(availabilityJson);
                service.setDescription((String) data.get("description"));
                sr.save(service);
            }
        }
    }
}