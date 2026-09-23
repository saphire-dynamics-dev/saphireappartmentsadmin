import nodemailer from 'nodemailer';
import { format } from 'date-fns';

// Create transporter (you'll need to add email credentials to .env.local)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};
// Email templates
const getApprovalEmailTemplate = (bookingRequest) => {
  const { guestDetails, bookingDetails, propertyTitle, propertyLocation } = bookingRequest;
  
  return {
    subject: `Booking Request Approved - ${propertyTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .label { font-weight: bold; color: #7C3AED; }
          .value { color: #333; }
          .highlight { background: #10B981; color: white; padding: 10px; border-radius: 5px; margin: 15px 0; text-align: center; }
          .next-steps { background: #EFF6FF; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Request Approved!</h1>
            <p>Great news! Your booking request has been approved.</p>
          </div>
          
          <div class="content">
            <p>Dear ${guestDetails.firstName} ${guestDetails.lastName},</p>
            
            <div class="highlight">
              ✅ Your booking request has been successfully approved!
            </div>
            
            <div class="booking-details">
              <h3>Booking Details</h3>
              <div class="detail-row">
                <span class="label">Property:</span>
                <span class="value">${propertyTitle}</span>
              </div>
              <div class="detail-row">
                <span class="label">Location:</span>
                <span class="value">${propertyLocation}</span>
              </div>
              <div class="detail-row">
                <span class="label">Check-in Date:</span>
                <span class="value">${format(new Date(bookingDetails.checkInDate), 'MMMM dd, yyyy')}</span>
              </div>
              <div class="detail-row">
                <span class="label">Check-out Date:</span>
                <span class="value">${format(new Date(bookingDetails.checkOutDate), 'MMMM dd, yyyy')}</span>
              </div>
              <div class="detail-row">
                <span class="label">Duration:</span>
                <span class="value">${bookingDetails.numberOfNights} nights</span>
              </div>
              <div class="detail-row">
                <span class="label">Number of Guests:</span>
                <span class="value">${bookingDetails.numberOfGuests}</span>
              </div>
              <div class="detail-row">
                <span class="label">Total Amount:</span>
                <span class="value">₦${bookingDetails.totalAmount.toLocaleString()}</span>
              </div>
            </div>
            
            <div class="next-steps">
              <h3>📞 Next Steps</h3>
              <p><strong>Our agent will contact you within 24 hours</strong> to:</p>
              <ul>
                <li>Confirm your booking details</li>
                <li>Discuss payment arrangements</li>
                <li>Provide check-in instructions</li>
                <li>Answer any questions you may have</li>
              </ul>
              <p><strong>Please ensure your phone (${guestDetails.phone}) is reachable.</strong></p>
            </div>
            
            <p>If you have any urgent questions or need to make changes to your booking, please contact us immediately.</p>
            
            <p>Thank you for choosing Saphire Apartments!</p>
            
            <div class="footer">
              <p>Best regards,<br>
              The Saphire Apartments Team<br>
              Email: info@saphireapartments.com<br>
              Phone: +234 XXX XXX XXXX</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Booking Request Approved - ${propertyTitle}
      
      Dear ${guestDetails.firstName} ${guestDetails.lastName},
      
      Great news! Your booking request has been approved.
      
      Booking Details:
      - Property: ${propertyTitle}
      - Location: ${propertyLocation}
      - Check-in: ${format(new Date(bookingDetails.checkInDate), 'MMMM dd, yyyy')}
      - Check-out: ${format(new Date(bookingDetails.checkOutDate), 'MMMM dd, yyyy')}
      - Duration: ${bookingDetails.numberOfNights} nights
      - Guests: ${bookingDetails.numberOfGuests}
      - Total: ₦${bookingDetails.totalAmount.toLocaleString()}
      
      Next Steps:
      Our agent will contact you within 24 hours at ${guestDetails.phone} to confirm your booking details and discuss payment arrangements.
      
      Thank you for choosing Saphire Apartments!
      
      Best regards,
      The Saphire Apartments Team
    `
  };
};

const getRejectionEmailTemplate = (bookingRequest, rejectionReason = '') => {
  const { guestDetails, bookingDetails, propertyTitle, propertyLocation } = bookingRequest;
  
  return {
    subject: `Booking Request Update - ${propertyTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #EF4444, #DC2626); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .label { font-weight: bold; color: #7C3AED; }
          .value { color: #333; }
          .rejection-notice { background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444; }
          .alternatives { background: #F0F9FF; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Request Update</h1>
            <p>Regarding your recent booking request</p>
          </div>
          
          <div class="content">
            <p>Dear ${guestDetails.firstName} ${guestDetails.lastName},</p>
            
            <div class="rejection-notice">
              <h3>❌ Booking Request Status</h3>
              <p>We regret to inform you that we cannot accommodate your booking request at this time.</p>
              ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
            </div>
            
            <div class="booking-details">
              <h3>Requested Booking Details</h3>
              <div class="detail-row">
                <span class="label">Property:</span>
                <span class="value">${propertyTitle}</span>
              </div>
              <div class="detail-row">
                <span class="label">Location:</span>
                <span class="value">${propertyLocation}</span>
              </div>
              <div class="detail-row">
                <span class="label">Check-in Date:</span>
                <span class="value">${format(new Date(bookingDetails.checkInDate), 'MMMM dd, yyyy')}</span>
              </div>
              <div class="detail-row">
                <span class="label">Check-out Date:</span>
                <span class="value">${format(new Date(bookingDetails.checkOutDate), 'MMMM dd, yyyy')}</span>
              </div>
              <div class="detail-row">
                <span class="label">Duration:</span>
                <span class="value">${bookingDetails.numberOfNights} nights</span>
              </div>
              <div class="detail-row">
                <span class="label">Number of Guests:</span>
                <span class="value">${bookingDetails.numberOfGuests}</span>
              </div>
            </div>
            
            <div class="alternatives">
              <h3>🏠 Alternative Options</h3>
              <p>We'd love to help you find suitable accommodation:</p>
              <ul>
                <li>Check our website for alternative dates</li>
                <li>Explore our other available properties</li>
                <li>Contact us to discuss flexible dates</li>
                <li>Join our waiting list for last-minute availability</li>
              </ul>
              <p><strong>Contact us:</strong> info@saphireapartments.com or call +234 XXX XXX XXXX</p>
            </div>
            
            <p>We apologize for any inconvenience caused and hope to serve you in the future.</p>
            
            <div class="footer">
              <p>Best regards,<br>
              The Saphire Apartments Team<br>
              Email: info@saphireapartments.com<br>
              Phone: +234 XXX XXX XXXX</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Booking Request Update - ${propertyTitle}
      
      Dear ${guestDetails.firstName} ${guestDetails.lastName},
      
      We regret to inform you that we cannot accommodate your booking request at this time.
      ${rejectionReason ? `\nReason: ${rejectionReason}` : ''}
      
      Requested Booking Details:
      - Property: ${propertyTitle}
      - Location: ${propertyLocation}
      - Check-in: ${format(new Date(bookingDetails.checkInDate), 'MMMM dd, yyyy')}
      - Check-out: ${format(new Date(bookingDetails.checkOutDate), 'MMMM dd, yyyy')}
      - Duration: ${bookingDetails.numberOfNights} nights
      - Guests: ${bookingDetails.numberOfGuests}
      
      Alternative Options:
      We'd love to help you find suitable accommodation. Please contact us at info@saphireapartments.com or +234 XXX XXX XXXX to discuss alternatives.
      
      We apologize for any inconvenience and hope to serve you in the future.
      
      Best regards,
      The Saphire Apartments Team
    `
  };
};

// Send email function
export const sendBookingStatusEmail = async (bookingRequest, status, rejectionReason = '') => {
  try {
    const transporter = createTransporter();
    let emailTemplate;
    
    if (status === 'Approved') {
      emailTemplate = getApprovalEmailTemplate(bookingRequest);
    } else if (status === 'Rejected') {
      emailTemplate = getRejectionEmailTemplate(bookingRequest, rejectionReason);
    } else {
      throw new Error('Invalid email status. Use "Approved" or "Rejected".');
    }
    
    const mailOptions = {
      from: `"Saphire Apartments" <${process.env.SMTP_USER}>`,
      to: bookingRequest.guestDetails.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Booking status email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending booking status email:', error);
    return { success: false, error: error.message };
  }
};

// Test email connection
export const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email service is ready');
    return { success: true };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
};
