package FixItNow.manager;

import java.math.BigDecimal;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import FixItNow.model.*;
import FixItNow.repository.*;


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
	
	public String generateNextUserId() {
	    String umaxId = ur.findMaxUserId(); // e.g., "U17"
	    int unextNum = 1;
	    if (umaxId != null && umaxId.startsWith("U")) {
	        unextNum = Integer.parseInt(umaxId.substring(1)) + 1;
	    }
	    return "U" + unextNum;
	
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
            service.setDescription("Default service description"); // If nullable, can omit
            service.setPrice(BigDecimal.ZERO);               // <-- Set a default value
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
	            Users U = ur.findByEmail(email); // <-- corrected: get Users object by email
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
}
