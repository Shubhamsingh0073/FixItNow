package FixItNow.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "provider_documents")
public class ProviderDocument {

    @Id
    @Column(name = "document_id", unique = true, updatable = false, nullable = false)
    private String id;

    @ManyToOne
    @JoinColumn(name = "provider_id", nullable = false)
    private Users provider;

    @Column(nullable = false)
    private String filename; // original filename

    @Column(nullable = false)
    private String storagePath; // server path where file is stored

    @CreationTimestamp
    private LocalDateTime uploadedAt;

    // getters / setters
    public String getId() 
    { 
    	return id; 
    }
    
    public void setId(String id) 
    { 
    	this.id = id; 
    }

    public Users getProvider() 
    { 
    	return provider; 
    }
    
    public void setProvider(Users provider) 
    { 
    	this.provider = provider; 
    }

    public String getFilename() 
    { 
    	return filename; 
    }
    
    public void setFilename(String filename) 
    { 
    	this.filename = filename; 
    }

    public String getStoragePath() 
    { 
    	return storagePath; 
    }
    
    public void setStoragePath(String storagePath) 
    {
    	this.storagePath = storagePath; 
    }

    public LocalDateTime getUploadedAt() 
    { 
    	return uploadedAt; 
    }
    
    public void setUploadedAt(LocalDateTime uploadedAt) 
    { 
    	this.uploadedAt = uploadedAt; 
    }
}