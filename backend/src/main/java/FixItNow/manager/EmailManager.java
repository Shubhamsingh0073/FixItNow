package FixItNow.manager;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailManager 
{
	@Autowired
	JavaMailSender JMS;
	public String sendEmail(String tomail, String subject, String message)
	{
		try 
		{
			SimpleMailMessage simplemessage = new SimpleMailMessage();
			simplemessage.setFrom("gnrgss01@gmail.com");
			simplemessage.setTo(tomail);
			simplemessage.setSubject(subject);
			simplemessage.setText(message);
			JMS.send(simplemessage);
			return "200::Password sent to registered Mail ID";
		}
		catch (Exception e) {
			return "401::"+e.getMessage();
		}
		
	}

}
