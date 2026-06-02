import { getCurrentUserFromContext } from './current-user.decorator';

describe('CurrentUser', () => {
  it('extracts the authenticated request user', () => {
    const user = {
      id: '83f3ec35-fb9b-41cb-8a18-746aba44aafa',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    };
    const context = {
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn(() => ({ user })),
      })),
    };
    const currentUser = getCurrentUserFromContext(context as never);

    expect(currentUser).toEqual(user);
  });
});
