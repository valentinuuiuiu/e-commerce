import { isClerkAuthenticated } from './isClerkAuthenticated'; // Adjust path as needed
import type { AccessArgs } from 'payload/types';
import type { User } from '../payload-types'; // Assuming User type might be used by AccessArgs generic

describe('isClerkAuthenticated Access Control', () => {
  it('should return true if req.auth.userId is present', () => {
    const mockReq = {
      // @ts-ignore - mocking a simplified request object for testing
      auth: {
        userId: 'user_clerk123',
      },
      user: null, // Explicitly null as Payload user is not used for this check
    };
    // Cast to DeepPartial<AccessArgs<any, User>> if more complex req needed
    const accessArgs = { req: mockReq } as unknown as AccessArgs<any, User>;
    expect(isClerkAuthenticated(accessArgs)).toBe(true);
  });

  it('should return false if req.auth is missing', () => {
    const mockReq = {
        user: null,
    };
    const accessArgs = { req: mockReq } as unknown as AccessArgs<any, User>;
    expect(isClerkAuthenticated(accessArgs)).toBe(false);
  });

  it('should return false if req.auth.userId is missing or null', () => {
    const mockReqNullUserId = {
      // @ts-ignore
      auth: {
        userId: null,
      },
      user: null,
    };
    const accessArgsNull = { req: mockReqNullUserId } as unknown as AccessArgs<any, User>;
    expect(isClerkAuthenticated(accessArgsNull)).toBe(false);

    const mockReqMissingUserId = {
        // @ts-ignore
        auth: {},
        user: null,
    };
    const accessArgsMissing = { req: mockReqMissingUserId } as unknown as AccessArgs<any, User>;
    expect(isClerkAuthenticated(accessArgsMissing)).toBe(false);
  });

  it('should return false if req.auth is present but userId is an empty string', () => {
    const mockReqEmptyUserId = {
      // @ts-ignore
      auth: {
        userId: '',
      },
      user: null,
    };
    const accessArgs = { req: mockReqEmptyUserId } as unknown as AccessArgs<any, User>;
    expect(isClerkAuthenticated(accessArgs)).toBe(false);
  });
});
