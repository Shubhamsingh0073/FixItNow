package FixItNow.model;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import FixItNow.repository.UsersRepository;


@Service
public class UsersManager {
	@Autowired
	UsersRepository ur;
	@Autowired
	EmailManager EM;
	@Autowired
	JWTManager jwt;
	
	public String AddUsers(Users u)
	{
		if(ur.validateEmail(u.getEmail())>0)
		{
			return "401::Email Already exists";
		}
		ur.save(u);
		return "200::User Registration Successful";	
		
	}
	
	
	public String recoverPassword(String email)
	{
		Users U=ur.findById(email).get();
		String message = String.format("Dear %s \n\n Your Password is %s",U.getName(),U.getPassword());
		
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
	
	public String getName(String token)
	{
		String email = jwt.validateToken(token);
		
		if(email.compareTo("401")==0)
		{
			return "401::Token Expired";
		}
		else
		{
			Users U = ur.findById(email).get();
			return U.getName();
		}
	}
	
}
