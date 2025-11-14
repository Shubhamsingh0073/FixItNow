package FixItNow.manager;

import java.math.BigDecimal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import FixItNow.model.*;
import FixItNow.repository.*;
import jakarta.transaction.Transactional;


@Service
public class UsersManager {
	@Autowired
	UsersRepository ur;
	@Autowired
	EmailManager EM;
	@Autowired
	JWTManager jwt;
	
	@Autowired
	ServicesManager sm;
	@Autowired
    ServicesRepository sr;
	
	// Replace existing method in UsersManager
	public String generateNextUserId() {
	    int max = 0;
	    // load all users (lightweight for modest user counts). If you prefer, add a repository query to return only ids.
	    for (Users u : ur.findAll()) {
	        String id = u.getId();
	        if (id != null && id.startsWith("U")) {
	            try {
	                int n = Integer.parseInt(id.substring(1));
	                if (n > max) max = n;
	            } catch (NumberFormatException ignored) {
	                // ignore non-numeric suffixes
	            }
	        }
	    }
	    return "U" + (max + 1);
	}
	
	public String AddUsers(Users u)
	{
		if(ur.validateEmail(u.getEmail())>0)
		{
			return "401::Email Already exists";
		}
		u.setId(generateNextUserId());
		
		Users savedUsers = ur.save(u);
		if (u.getRole() == UserRole.PROVIDER) {
            Services service = new Services();
            service.setId(sm.generateNextServiceId());
            service.setProvider(savedUsers); // links provider_id to users.id
            service.setCategory("Default Category");         // <-- Set a default value
            service.setSubcategory("Default Subcategory");   // <-- Set a default value
            service.setDescription("Default service description"); // If nullable, can omit             // <-- Set a default value
            service.setAvailability("{}");      
            
            sr.save(service);
        }
		return "200::User Registration Successful";	
		
	}
	
	
	public String recoverPassword(String email) {
        Users U = ur.findByEmail(email); // <-- corrected: get Users object
        String message = String.format("Dear %s \n\n Your Password is %s", U.getName(), U.getPassword());
        return EM.sendEmail(U.getEmail(), "Job-Portal Password Recovery", message);
    }
	
	public String validateCredentials(String email, String password)
	{
		if(ur.validatecredentials(email, password)>0)
		{
			String token = jwt.generateToken(email);
			return "200::"+token;
		}
		else
		{
			return "401::Invalid Credentials";
		}
	}
	
	 public String getName(String token) {
	        String email = jwt.validateToken(token);
	        if (email.compareTo("401") == 0) {
	            return "401::Token Expired";
	        } else {
	            Users U = ur.findByEmail(email); // <-- get Users object by email
	            return U.getName();
	        }
	}
	
	 
	 public String validateToken(String token) {
		    return jwt.validateToken(token);
		}
	 
	 public Users getUserByEmail(String email) {
		    return ur.findByEmail(email);
		}
	 
	 public void updatePhone(String email, String phone) {
		    Users user = ur.findByEmail(email);
		    if (user != null) {
		        user.setPhno(phone);
		        ur.save(user);
		    }
		}
	 
	// inside UsersManager.java (or your manager class)
	 @Transactional
	 public boolean updatePasswordByEmail(String email, String newPassword) {
	     Users u = getUserByEmail(email);
	     if (u == null) return false;
	     u.setPassword(newPassword);
	     ur.save(u);
	     return true;
	 }
}
