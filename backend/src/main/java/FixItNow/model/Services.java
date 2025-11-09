package FixItNow.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "services")
public class Services {

	@Id
    @Column(name = "service_id", unique = true, updatable = false, nullable = false)
    private String id;
	
    @ManyToOne
    @JoinColumn(name = "provider_id", referencedColumnName = "user_id", nullable = false)
    private Users provider;

    @Column(nullable = false)
    private String category;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "verified", nullable = false)
    private ServicesVerified verified = ServicesVerified.PENDING;

    @Column(columnDefinition = "TEXT") 
    private String subcategory;

    @Lob
    private String description;


    @Column(columnDefinition = "TEXT")
    private String availability; // JSON stored as String


    // Getters and setters
    
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Users getProvider() {
        return provider;
    }

    public void setProvider(Users provider) {
        this.provider = provider;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }
    
    public ServicesVerified getVerified() { 
    	return verified; 
    }
    
    public void setVerified(ServicesVerified verified) { 
    	this.verified = verified; 
    }


    public String getSubcategory() {
        return subcategory;
    }

    public void setSubcategory(String subcategory) {
        this.subcategory = subcategory;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAvailability() {
        return availability;
    }

    public void setAvailability(String availability) {
        this.availability = availability;
    }

}