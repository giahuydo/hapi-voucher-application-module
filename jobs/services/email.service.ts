import nodemailer from 'nodemailer';
import { AppError, ValidationError } from '../../utils/errorHandler';
import logger from '../../utils/logger';

interface EmailData {
  to: string;
  code: string;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const sendEmail = async (data: EmailData): Promise<EmailResponse> => {
  try {
    logger.info(`Starting email send to: ${data.to} with voucher code: ${data.code}`);
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.to)) {
      logger.warn(`Invalid email format: ${data.to}`);
      throw new ValidationError('Invalid email format');
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: data.to,
      subject: '🎉 Your Voucher Code is Here!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50; text-align: center;">🎉 Congratulations!</h2>
          <div style="background-color: #ecf0f1; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #27ae60; text-align: center;">Your Voucher Code</h3>
            <div style="background-color: #ffffff; padding: 15px; border: 2px dashed #3498db; border-radius: 8px; text-align: center; margin: 15px 0;">
              <h1 style="color: #e74c3c; font-size: 24px; margin: 0; letter-spacing: 2px;">${data.code}</h1>
            </div>
            <p style="text-align: center; color: #7f8c8d; font-size: 14px;">
              Use this code before it expires. Thank you for participating!
            </p>
          </div>
          <div style="text-align: center; color: #95a5a6; font-size: 12px;">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      `
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);
    
    logger.info(`Email sent successfully to ${data.to}. Message ID: ${result.messageId}`);
    
    return {
      success: true,
      messageId: result.messageId
    };

  } catch (error: any) {
    logger.error(`Failed to send email to ${data.to}:`, {
      error: error?.message || 'Unknown error',
      stack: error?.stack,
      email: data.to,
      code: data.code
    });

    return {
      success: false,
      error: error?.message || 'Email sending failed'
    };
  }
};
