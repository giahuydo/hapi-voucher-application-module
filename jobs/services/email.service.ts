import nodemailer from 'nodemailer';
import { AppError, ValidationError } from '../../utils/errorHandler';
import {logger} from '../../utils/logger';

interface voucherData {
  to: string;
  code: string;
  email: string;
  name: string;
  voucherCode: string;
  eventName: string;
  eventDescription: string;
  // Additional voucher fields
  recipientName?: string;
  phoneNumber?: string;
  type?: 'percentage' | 'fixed';
  value?: number;
  usageLimit?: number;
  minimumOrderAmount?: number;
  maximumDiscount?: number;
  // Date fields (consolidated)
  validFrom?: string;    // When voucher becomes valid
  validTo?: string;      // When voucher expires
  notes?: string;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const sendEmail = async (data: voucherData): Promise<EmailResponse> => {
  try {
    logger.info(`📧 Starting email send to: ${data.to} with voucher code: ${data.code}`);
    console.log(`📧 Starting email send to: ${data.to} with voucher code: ${data.code}`);
    
    // Check email credentials
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      const error = 'Email credentials not configured';
      logger.error(`❌ ${error}`);
      console.error(`❌ ${error}`);
      throw new AppError(error, 500);
    }
    
    // Log email credentials info (without exposing password)
    logger.info(`📧 Email config: user=${process.env.EMAIL_USER}, pass_length=${process.env.EMAIL_PASS?.length}`);
    console.log(`📧 Email config: user=${process.env.EMAIL_USER}, pass_length=${process.env.EMAIL_PASS?.length}`);
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.to)) {
      logger.warn(`⚠️ Invalid email format: ${data.to}`);
      console.warn(`⚠️ Invalid email format: ${data.to}`);
      throw new ValidationError('Invalid email format');
    }

    // Create transporter with timeout and retry settings
    logger.info(`🔧 Creating email transporter with Gmail service...`);
    console.log(`🔧 Creating email transporter with Gmail service...`);
    
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 30000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
      dnsTimeout: 10000,
      pool: true,
      maxConnections: 1,
      maxMessages: 10,
      rateDelta: 30000,
      rateLimit: 3,
      family: 4,
    } as any);
    
    // Test transporter connection
    logger.info(`🔄 Testing email transporter connection...`);
    console.log(`🔄 Testing email transporter connection...`);
    
    try {
      await transporter.verify();
      logger.info(`✅ Email transporter verified successfully`);
      console.log(`✅ Email transporter verified successfully`);
    } catch (verifyError: any) {
      logger.error(`❌ Email transporter verification failed:`, verifyError.message);
      console.error(`❌ Email transporter verification failed:`, verifyError.message);
      throw new AppError(`Email transporter verification failed: ${verifyError.message}`, 500);
    }

    // Email content
    const { 
      email, 
      name, 
      voucherCode, 
      eventName, 
      eventDescription,
      recipientName,
      phoneNumber,
      type,
      value,
      usageLimit,
      minimumOrderAmount,
      maximumDiscount,
      validFrom,
      validTo,
      notes
    } = data;

    const mailOptions = {
      from: process.env.EMAIL_USER,    
      to: data.to,
      subject: '🎫 Your Voucher is Ready!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">🎫 Voucher Issued!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You have received a new voucher</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-top: 0;">Hello ${recipientName || name}!</h2>
            <p style="color: #666; line-height: 1.6;">
              Congratulations! You have been issued a voucher for the following event:
            </p>
            
            <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">${eventName}</h3>
              <p style="color: #666; margin: 10px 0;">${eventDescription || 'No description available'}</p>
              
              <div style="background: #e9ecef; padding: 15px; border-radius: 5px; text-align: center; margin: 15px 0;">
                <strong style="color: #333; font-size: 18px;">Voucher Code:</strong>
                <div style="font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; color: #28a745; margin: 10px 0; letter-spacing: 2px;">
                  ${voucherCode}
                </div>
              </div>
            </div>

            <!-- Voucher Details -->
            <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #28a745; padding-bottom: 10px;">📋 Voucher Details</h3>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0;">
                ${type ? `
                <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
                  <strong style="color: #333;">Type:</strong><br>
                  <span style="color: #666;">${type === 'percentage' ? 'Percentage Discount' : 'Fixed Amount'}</span>
                </div>
                ` : ''}
                
                ${value ? `
                <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
                  <strong style="color: #333;">Value:</strong><br>
                  <span style="color: #28a745; font-weight: bold;">${type === 'percentage' ? value + '%' : '$' + value}</span>
                </div>
                ` : ''}
                
                ${usageLimit ? `
                <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
                  <strong style="color: #333;">Usage Limit:</strong><br>
                  <span style="color: #666;">${usageLimit} times</span>
                </div>
                ` : ''}
                
                ${minimumOrderAmount ? `
                <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
                  <strong style="color: #333;">Min. Order:</strong><br>
                  <span style="color: #666;">$${minimumOrderAmount}</span>
                </div>
                ` : ''}
                
                ${maximumDiscount ? `
                <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
                  <strong style="color: #333;">Max. Discount:</strong><br>
                  <span style="color: #666;">$${maximumDiscount}</span>
                </div>
                ` : ''}
                
                ${phoneNumber ? `
                <div style="background: #f8f9fa; padding: 10px; border-radius: 5px;">
                  <strong style="color: #333;">Phone:</strong><br>
                  <span style="color: #666;">${phoneNumber}</span>
                </div>
                ` : ''}
              </div>
            </div>

            <!-- Validity Period -->
            ${(validFrom || validTo) ? `
            <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0; border-bottom: 2px solid #ffc107; padding-bottom: 10px;">⏰ Validity Period</h3>
              
              ${validFrom ? `
              <div style="margin: 10px 0;">
                <strong style="color: #333;">Valid From:</strong>
                <span style="color: #666; margin-left: 10px;">${new Date(validFrom).toLocaleDateString()}</span>
              </div>
              ` : ''}
              
              ${validTo ? `
              <div style="margin: 10px 0;">
                <strong style="color: #333;">Expires On:</strong>
                <span style="color: #dc3545; margin-left: 10px; font-weight: bold;">${new Date(validTo).toLocaleDateString()}</span>
              </div>
              ` : ''}
            </div>
            ` : ''}

            <!-- Notes -->
            ${notes ? `
            <div style="background: #e3f2fd; border: 1px solid #2196f3; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">📝 Special Notes</h3>
              <p style="color: #333; margin: 0; line-height: 1.6;">${notes}</p>
            </div>
            ` : ''}
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>⚠️ Important:</strong> Please keep this voucher code safe. You will need it to redeem your voucher.
              </p>
            </div>
          </div>
          
          <div style="background: #e9ecef; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">This is an automated message. Please do not reply to this email.</p>
            <p style="margin: 5px 0 0 0;">© 2024 Express GraphQL Demo. All rights reserved.</p>
          </div>
        </div>
      `,
    };


    // Send email with retry mechanism
    let result;
    let lastError;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`📤 Sending email to ${data.to} (attempt ${attempt}/${maxRetries})...`);
        
        result = await transporter.sendMail(mailOptions);
        
        logger.info(`✅ Email sent successfully to ${data.to}. Message ID: ${result.messageId}`);
        
        return {
          success: true,
          messageId: result.messageId
        };
        
      } catch (error: any) {
        lastError = error;
        logger.warn(`⚠️ Email send attempt ${attempt} failed for ${data.to}: ${error?.message}`);
        console.warn(`⚠️ Email send attempt ${attempt} failed for ${data.to}: ${error?.message}`);
        
        // Log detailed error info
        logger.error(`❌ Email send error details:`, {
          attempt,
          email: data.to,
          error: error?.message,
          code: error?.code,
          command: error?.command,
          response: error?.response,
          stack: error?.stack
        });
        console.error(`❌ Email send error details:`, {
          attempt,
          email: data.to,
          error: error?.message,
          code: error?.code,
          command: error?.command,
          response: error?.response
        });
        
        if (attempt < maxRetries) {
          const delay = attempt * 2000; // 2s, 4s, 6s
          logger.info(`⏳ Retrying in ${delay}ms...`);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed
    throw lastError;

  } catch (error: any) {
    logger.error(`❌ Failed to send email to ${data.to}:`, {
      error: error?.message || 'Unknown error',
      stack: error?.stack,
      email: data.to,
      code: data.code,
      errorCode: error?.code,
      command: error?.command,
      response: error?.response
    });
    console.error(`❌ Failed to send email to ${data.to}:`, {
      error: error?.message || 'Unknown error',
      email: data.to,
      code: data.code,
      errorCode: error?.code,
      command: error?.command,
      response: error?.response
    });

    return {
      success: false,
      error: error?.message || 'Email sending failed'
    };
  }
};
