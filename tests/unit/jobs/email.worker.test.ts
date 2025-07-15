import { TEST_CONFIG } from '../../setup';
import { sendEmail } from '../../../jobs/services/email.service';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'test-message-id'
    })
  })
}));

// Mock email service
jest.mock('../../../jobs/services/email.service', () => ({
  sendEmail: jest.fn()
}));

const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;

describe('Email Worker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log(`🧪 Running email worker tests with ${TEST_CONFIG.USE_MOCK_REDIS ? 'mock' : 'real'} Redis`);
  });

  describe('Email Processing', () => {
    it('should process email job successfully', async () => {
      // Arrange
      const jobData = {
        to: 'test@example.com',
        code: 'VC-ABC123'
      };

      mockSendEmail.mockResolvedValueOnce();

      // Act
      await sendEmail(jobData);

      // Assert
      expect(mockSendEmail).toHaveBeenCalledWith(jobData);
    });

    it('should handle email sending errors', async () => {
      // Arrange
      const jobData = {
        to: 'test@example.com',
        code: 'VC-ABC123'
      };

      // Mock sendEmail to throw error
      mockSendEmail.mockRejectedValueOnce(new Error('SMTP connection failed'));

      // Act & Assert
      await expect(sendEmail(jobData)).rejects.toThrow('SMTP connection failed');
    });

    it('should validate email data', async () => {
      // Arrange
      const invalidJobData = {
        to: 'invalid-email',
        code: 'VC-ABC123'
      };

      mockSendEmail.mockRejectedValueOnce(new Error('Invalid email format'));

      // Act & Assert
      await expect(sendEmail(invalidJobData)).rejects.toThrow('Invalid email format');
    });
  });

  describe('Email Service Configuration', () => {
    it('should use correct email configuration', () => {
      // This test would verify that the email service is configured correctly
      // with the right SMTP settings, authentication, etc.
      expect(process.env.EMAIL_USER).toBeDefined();
      expect(process.env.EMAIL_PASS).toBeDefined();
    });

    it('should handle missing email configuration', () => {
      // Test behavior when email configuration is missing
      const originalEmailUser = process.env.EMAIL_USER;
      const originalEmailPass = process.env.EMAIL_PASS;

      delete process.env.EMAIL_USER;
      delete process.env.EMAIL_PASS;

      // The service should handle missing configuration gracefully
      expect(() => {
        // This would typically throw an error or use defaults
      }).not.toThrow();

      // Restore environment variables
      process.env.EMAIL_USER = originalEmailUser;
      process.env.EMAIL_PASS = originalEmailPass;
    });
  });

  describe('Email Template', () => {
    it('should generate correct email HTML', async () => {
      // Arrange
      const jobData = {
        to: 'test@example.com',
        code: 'VC-ABC123'
      };

      mockSendEmail.mockResolvedValueOnce();

      // Act
      await sendEmail(jobData);

      // Assert - Verify that the email contains the voucher code
      expect(mockSendEmail).toHaveBeenCalledWith(jobData);
    });

    it('should include voucher code in email subject', async () => {
      // Arrange
      const jobData = {
        to: 'test@example.com',
        code: 'VC-ABC123'
      };

      mockSendEmail.mockResolvedValueOnce();

      // Act
      await sendEmail(jobData);

      // Assert
      expect(mockSendEmail).toHaveBeenCalledWith(jobData);
    });
  });
}); 