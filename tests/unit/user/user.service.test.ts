import * as UserService from '../../../src/modules/user/user.service';
import { User } from '../../../src/modules/user/user.model';

const mockUsers = [
  { _id: '1', name: 'Alice', email: 'a@mail.com', role: 'user', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { _id: '2', name: 'Bob', email: 'b@mail.com', role: 'admin', isActive: false, createdAt: new Date(), updatedAt: new Date() },
];

describe('UserService.getAllUsers', () => {
  afterEach(() => {
    jest.restoreAllMocks(); // reset mock sau mỗi test
  });

  it('should return transformed list of users', async () => {
    jest.spyOn(User, 'find').mockReturnValueOnce({
      lean: () => Promise.resolve(mockUsers),
    } as any);

    const result = await UserService.getAllUsers();

    expect(result.length).toBe(2);
    expect(result[0]).toMatchObject({ name: 'Alice', email: 'a@mail.com' });
    expect(result[1]).toMatchObject({ name: 'Bob', role: 'admin' });
  });

  it('should return an empty array when no users exist', async () => {
    jest.spyOn(User, 'find').mockReturnValueOnce({
      lean: () => Promise.resolve([]),
    } as any);

    const result = await UserService.getAllUsers();

    expect(result).toEqual([]);
  });

  it('should throw an error if query fails', async () => {
    jest.spyOn(User, 'find').mockReturnValueOnce({
      lean: () => Promise.reject(new Error('Database error')),
    } as any);

    await expect(UserService.getAllUsers()).rejects.toThrow('Database error');
  });

  it('should call User.find() exactly once', async () => {
    const spy = jest.spyOn(User, 'find').mockReturnValueOnce({
      lean: () => Promise.resolve(mockUsers),
    } as any);

    await UserService.getAllUsers();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});