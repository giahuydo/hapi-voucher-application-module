import * as UserService from '../src/modules/user/user.service';
import { getAllUsers } from '../src/modules/user/user.service';

describe('Direct Import', () => {
  it('should work', () => {
    expect(getAllUsers).toBeDefined();
    expect(typeof getAllUsers).toBe('function');
  });
});

console.log('UserService:', UserService);
console.log('getAllUsers:', getAllUsers);
console.log('typeof getAllUsers:', typeof UserService.getAllUsers);

describe('Debug Import', () => {
  it('should have getAllUsers function', () => {
    expect(UserService.getAllUsers).toBeDefined();
    expect(typeof UserService.getAllUsers).toBe('function');
  });
});