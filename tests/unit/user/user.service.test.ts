import * as UserService from '../../../src/modules/user/user.service';
import * as UserModel from '../../../src/modules/user/user.model';
import { transformUserList } from '../../../src/modules/user/user.transformer';
import { User } from '../../../src/modules/user/user.model';

// Mock dữ liệu
const mockUsers = [
  { _id: '1', name: 'Alice', email: 'a@mail.com', role: 'user', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { _id: '2', name: 'Bob', email: 'b@mail.com', role: 'admin', isActive: false, createdAt: new Date(), updatedAt: new Date() },
];

describe('getAllUsers', () => {
  it('should return transformed list of users', async () => {
    jest.spyOn(User, 'find').mockReturnValueOnce({
      lean: () => Promise.resolve(mockUsers),
    } as any);

    const result = await UserService.getAllUsers();

    expect(result.length).toBe(2);
    expect(result[0]).toMatchObject({ name: 'Alice', email: 'a@mail.com' });
    expect(result[1]).toMatchObject({ name: 'Bob', role: 'admin' });
  });
});