import mongoose from 'mongoose';
import { Voucher } from '../../../src/modules/voucher/voucher.model';
import { deleteVoucher } from '../../../src/modules/voucher/voucher.service';
import { NotFoundError } from '../../../utils/errorHandler';

// Mock the logger
jest.mock('../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('deleteVoucher', () => {
  let mockVoucher: any;

  beforeEach(() => {
    mockVoucher = {
      _id: new mongoose.Types.ObjectId(),
      eventId: new mongoose.Types.ObjectId(),
      code: 'TEST123',
      issuedTo: 'user123',
      isUsed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should delete an unused voucher successfully', async () => {
    // Mock findById to return an unused voucher
    const findByIdSpy = jest.spyOn(Voucher, 'findById').mockResolvedValue(mockVoucher);
    
    // Mock findByIdAndDelete to return the deleted voucher
    const findByIdAndDeleteSpy = jest.spyOn(Voucher, 'findByIdAndDelete').mockResolvedValue(mockVoucher);

    const result = await deleteVoucher(mockVoucher._id.toString());

    expect(findByIdSpy).toHaveBeenCalledWith(mockVoucher._id.toString());
    expect(findByIdAndDeleteSpy).toHaveBeenCalledWith(mockVoucher._id.toString());
    expect(result).toEqual({ message: 'Voucher deleted successfully' });
  });

  it('should throw NotFoundError when voucher does not exist', async () => {
    // Mock findById to return null
    jest.spyOn(Voucher, 'findById').mockResolvedValue(null);

    await expect(deleteVoucher('nonexistentid')).rejects.toThrow(NotFoundError);
    await expect(deleteVoucher('nonexistentid')).rejects.toThrow('Voucher with ID nonexistentid not found');
  });

  it('should throw ConflictError when trying to delete a used voucher', async () => {
    // Mock findById to return a used voucher
    const usedVoucher = { ...mockVoucher, isUsed: true };
    jest.spyOn(Voucher, 'findById').mockResolvedValue(usedVoucher);

    await expect(deleteVoucher(mockVoucher._id.toString())).rejects.toThrow('Cannot delete a voucher that has been used');
  });

  it('should throw error when findByIdAndDelete fails', async () => {
    // Mock findById to return an unused voucher
    jest.spyOn(Voucher, 'findById').mockResolvedValue(mockVoucher);
    
    // Mock findByIdAndDelete to return null (deletion failed)
    jest.spyOn(Voucher, 'findByIdAndDelete').mockResolvedValue(null);

    await expect(deleteVoucher(mockVoucher._id.toString())).rejects.toThrow('Failed to delete voucher');
  });

  it('should handle database errors gracefully', async () => {
    // Mock findById to throw a database error
    jest.spyOn(Voucher, 'findById').mockRejectedValue(new Error('Database connection error'));

    await expect(deleteVoucher(mockVoucher._id.toString())).rejects.toThrow('Database connection error');
  });
});
