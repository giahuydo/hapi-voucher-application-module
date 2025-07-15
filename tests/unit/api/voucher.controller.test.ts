import { Request, ResponseToolkit } from '@hapi/hapi';
import { requestVoucher } from '../../../src/api/voucher/controller';
import * as voucherService from '../../../src/services/voucher.service';
import { TEST_CONFIG } from '../../setup';

// Mock the voucher service
jest.mock('../../../src/services/voucher.service');

const mockVoucherService = voucherService as jest.Mocked<typeof voucherService>;

describe('Voucher Controller', () => {
  let mockRequest: Partial<Request>;
  let mockH: Partial<ResponseToolkit>;
  let mockResponse: any;

  beforeEach(() => {
    jest.clearAllMocks();
    console.log(`🧪 Running controller tests with ${TEST_CONFIG.USE_MOCK_DB ? 'mock' : 'real'} database`);

    // Mock response object
    mockResponse = {
      code: jest.fn().mockReturnThis()
    };

    // Mock request object
    mockRequest = {
      params: { eventId: '507f1f77bcf86cd799439011' },
      payload: { userId: 'test-user-123' }
    } as Partial<Request>;

    // Mock response toolkit
    mockH = {
      response: jest.fn().mockReturnValue(mockResponse)
    } as Partial<ResponseToolkit>;
  });

  describe('requestVoucher', () => {
    it('should return success response when voucher is issued', async () => {
      // Arrange
      const mockServiceResponse = {
        success: true,
        message: '✅ Voucher issued successfully.',
        code: 200,
        data: { code: 'VC-ABC123' }
      };

      mockVoucherService.issueVoucher.mockResolvedValue(mockServiceResponse);

      // Act
      const result = await requestVoucher(
        mockRequest as Request,
        mockH as ResponseToolkit
      );

      // Assert
      expect(mockVoucherService.issueVoucher).toHaveBeenCalledWith({
        eventId: '507f1f77bcf86cd799439011',
        userId: 'test-user-123'
      });

      expect(mockH.response).toHaveBeenCalledWith({
        message: '✅ Voucher issued successfully.',
        data: { code: 'VC-ABC123' }
      });

      expect(mockResponse.code).toHaveBeenCalledWith(200);
    });

    it('should return error response when voucher issuance fails', async () => {
      // Arrange
      const mockServiceResponse = {
        success: false,
        message: '🎟️ Voucher has been exhausted.',
        code: 456
      };

      mockVoucherService.issueVoucher.mockResolvedValue(mockServiceResponse);

      // Act
      const result = await requestVoucher(
        mockRequest as Request,
        mockH as ResponseToolkit
      );

      // Assert
      expect(mockVoucherService.issueVoucher).toHaveBeenCalledWith({
        eventId: '507f1f77bcf86cd799439011',
        userId: 'test-user-123'
      });

      expect(mockH.response).toHaveBeenCalledWith({
        message: '🎟️ Voucher has been exhausted.'
      });

      expect(mockResponse.code).toHaveBeenCalledWith(456);
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const mockServiceResponse = {
        success: false,
        message: 'Internal server error.',
        code: 500
      };

      mockVoucherService.issueVoucher.mockResolvedValue(mockServiceResponse);

      // Act
      const result = await requestVoucher(
        mockRequest as Request,
        mockH as ResponseToolkit
      );

      // Assert
      expect(mockH.response).toHaveBeenCalledWith({
        message: 'Internal server error.'
      });

      expect(mockResponse.code).toHaveBeenCalledWith(500);
    });

    it('should handle missing data in request', async () => {
      // Arrange
      const incompleteRequest = {
        params: { eventId: '507f1f77bcf86cd799439011' },
        payload: {} // Missing userId
      } as Partial<Request>;

      // Act & Assert
      await expect(
        requestVoucher(
          incompleteRequest as Request,
          mockH as ResponseToolkit
        )
      ).rejects.toThrow();
    });

    it('should handle invalid eventId format', async () => {
      // Arrange
      const invalidRequest = {
        params: { eventId: 'invalid-id' },
        payload: { userId: 'test-user-123' }
      } as Partial<Request>;

      // Act & Assert
      await expect(
        requestVoucher(
          invalidRequest as Request,
          mockH as ResponseToolkit
        )
      ).rejects.toThrow();
    });
  });
}); 