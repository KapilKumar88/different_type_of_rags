import { IS_PUBLIC_KEY, Public } from './public.decorator';

describe('Public', () => {
  it('sets public route metadata', () => {
    const descriptor = {
      value: jest.fn(),
    };

    Public()(class TestController {}, 'testRoute', descriptor);

    expect(Reflect.getMetadata(IS_PUBLIC_KEY, descriptor.value)).toBe(true);
  });
});
