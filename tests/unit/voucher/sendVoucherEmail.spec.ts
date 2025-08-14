import { sendVoucherNotificationEmail } from '../../../src/modules/voucher/voucher.service';
import * as UserService from '../../../src/modules/user/user.service';
import emailQueue from '../../../jobs/queues/email.queue';

// Mock dependencies
jest.mock('../../../src/modules/user/user.service', () => ({
  getUserById: jest.fn(),
}));
jest.mock('../../../jobs/queues/email.queue', () => ({
  __esModule: true,
  default: {
    add: jest.fn(),
  },
}));

describe('sendVoucherNotificationEmail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should queue email job when user has email', async () => {
    const userId = 'user123';
    const code = 'TEST123';
    
    (UserService.getUserById as jest.Mock).mockResolvedValue({ 
      email: 'test@example.com' 
    });
    (emailQueue.add as jest.Mock).mockResolvedValue(true);

    await sendVoucherNotificationEmail(userId, code);

    expect(UserService.getUserById).toHaveBeenCalledWith(userId);
    expect(emailQueue.add).toHaveBeenCalledWith('send-voucher-email', {
      to: 'test@example.com',
      code: code
    });
  });

  it('should not queue email when user has no email', async () => {
    const userId = 'user123';
    const code = 'TEST123';
    
    (UserService.getUserById as jest.Mock).mockResolvedValue({ 
      email: null 
    });

    await sendVoucherNotificationEmail(userId, code);

    expect(UserService.getUserById).toHaveBeenCalledWith(userId);
    expect(emailQueue.add).not.toHaveBeenCalled();
  });
});
