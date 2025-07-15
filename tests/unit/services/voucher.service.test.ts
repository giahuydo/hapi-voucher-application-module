import { issueVoucher } from '../../../src/services/voucher.service';
import Event from '../../../src/models/event.model';
import Voucher from '../../../src/models/voucher.model';
import emailQueue from '../../../jobs/queues/email.queue';
import * as UserService from '../../src/services/user.service';

import { TEST_CONFIG } from '../../setup';

// Mock dependencies
jest.mock('../../../src/models/event.model');
jest.mock('../../../src/models/voucher.model');
jest.mock('../../../jobs/queues/email.queue');
jest.mock('../../src/services/user.service');


const mockEvent = Event as jest.Mocked<typeof Event>;
const mockVoucher = Voucher as jest.Mocked<typeof Voucher>;
const mockEmailQueue = emailQueue as jest.Mocked<typeof emailQueue>;

describe('VoucherService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log(`🧪 Running tests with ${TEST_CONFIG.USE_MOCK_DB ? 'mock' : 'real'} database`);
  });

  describe('issueVoucher', () => {
    it('should issue voucher successfully when event has available vouchers', async () => {
      // Arrange
      const eventId = '507f1f77bcf86cd799439011';
      const userId = 'user123';
      const mockUser = { id: userId, email: 'giahuydo1379@gmail.com' };
      
      const mockEventDoc = {
        _id: eventId,
        name: 'Test Event',
        maxQuantity: 100,
        issuedCount: 50,
        save: jest.fn().mockResolvedValue(true)
      };

      mockEvent.findById.mockReturnValue({
        session: jest.fn().mockReturnValue(mockEventDoc)
      } as any);

      mockVoucher.create.mockResolvedValue([{
        _id: 'voucher123',
        code: 'VC-ABC123',
        eventId,
        issuedTo: userId,
        isUsed: false
      }] as any);

      mockEmailQueue.add.mockResolvedValue({} as any);

      // Act
      const result = await issueVoucher({ eventId, userId });

      mockedUserService.getUserById.mockResolvedValue(mockUser);


      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('✅ Voucher issued successfully.');
      expect(result.data?.code).toBeDefined();
      expect(mockEventDoc.issuedCount).toBe(51);
      expect(mockEventDoc.save).toHaveBeenCalled();
      expect(mockEmailQueue.add).toHaveBeenCalledWith({
        to: userId,
        code: expect.any(String)
      });
    });

    it('should return error when event is not found', async () => {
      // Arrange
      const eventId = '507f1f77bcf86cd799439011';
      const userId = 'user123';

      mockEvent.findById.mockReturnValue({
        session: jest.fn().mockReturnValue(null)
      } as any);

      // Act
      const result = await issueVoucher({ eventId, userId });

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('🎟️ Voucher has been exhausted.');
      expect(result.code).toBe(456);
    });

    it('should return error when event is exhausted', async () => {
      // Arrange
      const eventId = '507f1f77bcf86cd799439011';
      const userId = 'user123';
      
      const mockEventDoc = {
        _id: eventId,
        name: 'Test Event',
        maxQuantity: 100,
        issuedCount: 100, // Exhausted
        save: jest.fn().mockResolvedValue(true)
      };

      mockEvent.findById.mockReturnValue({
        session: jest.fn().mockReturnValue(mockEventDoc)
      } as any);

      // Act
      const result = await issueVoucher({ eventId, userId });

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('🎟️ Voucher has been exhausted.');
      expect(result.code).toBe(456);
    });

    it('should handle database transaction errors gracefully', async () => {
      // Arrange
      const eventId = '507f1f77bcf86cd799439011';
      const userId = 'user123';

      mockEvent.findById.mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      // Act
      const result = await issueVoucher({ eventId, userId });

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Internal server error.');
      expect(result.code).toBe(500);
    });

    it('should retry transaction on transient errors', async () => {
      // Arrange
      const eventId = '507f1f77bcf86cd799439011';
      const userId = 'user123';
      
      const mockEventDoc = {
        _id: eventId,
        name: 'Test Event',
        maxQuantity: 100,
        issuedCount: 50,
        save: jest.fn().mockResolvedValue(true)
      };

      // Simulate transient error on first attempt, success on second
      let attemptCount = 0;
      mockEvent.findById.mockImplementation(() => {
        attemptCount++;
        if (attemptCount === 1) {
          const error = new Error('TransientTransactionError');
          (error as any).hasErrorLabel = (label: string) => label === 'TransientTransactionError';
          throw error;
        }
        return {
          session: jest.fn().mockReturnValue(mockEventDoc)
        } as any;
      });

      mockVoucher.create.mockResolvedValue([{
        _id: 'voucher123',
        code: 'VC-ABC123',
        eventId,
        issuedTo: userId,
        isUsed: false
      }] as any);

      mockEmailQueue.add.mockResolvedValue({} as any);

      // Act
      const result = await issueVoucher({ eventId, userId });

      // Assert
      expect(result.success).toBe(true);
      expect(attemptCount).toBe(2);
    });
  });
}); 