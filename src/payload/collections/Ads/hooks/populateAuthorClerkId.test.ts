import { populateAuthorClerkId } from './populateAuthorClerkId'; // Adjust path as needed
import type { CollectionBeforeChangeHook } from 'payload/types';
import type { Ad } from '../../../payload-types';

describe('populateAuthorClerkId Hook', () => {
  // Define a type for the hook arguments for easier mocking
  type HookArgs = Parameters<CollectionBeforeChangeHook<Ad>>[0];

  it('should set data.authorClerkId if operation is "create" and req.auth.userId is present', async () => {
    const mockReq = {
      // @ts-ignore - mocking for test
      auth: {
        userId: 'user_clerk123',
      },
    };
    const mockData: Partial<Ad> = { title: 'New Ad' }; // Initial data

    const args: HookArgs = {
      // @ts-ignore
      req: mockReq,
      operation: 'create',
      data: mockData,
      // Add other required args for HookArgs if any, or cast to Partial
      originalDoc: undefined,
      collection: {} as any, // Mock collection config if needed by hook
    };

    const result = await populateAuthorClerkId(args);

    expect(result.authorClerkId).toBe('user_clerk123');
    // Ensure other data is not lost
    expect(result.title).toBe('New Ad');
  });

  it('should not modify data.authorClerkId if operation is "update"', async () => {
    const mockReq = {
      // @ts-ignore
      auth: {
        userId: 'user_clerk456', // A different user, but shouldn't matter for update
      },
    };
    const mockData: Partial<Ad> = { authorClerkId: 'existing_author_id' };

    const args: HookArgs = {
      // @ts-ignore
      req: mockReq,
      operation: 'update',
      data: mockData,
      originalDoc: { authorClerkId: 'existing_author_id' } as Ad, // Cast to Ad
      collection: {} as any,
    };

    const result = await populateAuthorClerkId(args);

    expect(result.authorClerkId).toBe('existing_author_id'); // Should remain unchanged
  });

  it('should not set data.authorClerkId if req.auth.userId is missing during "create"', async () => {
    const mockReq = {
      // @ts-ignore
      auth: null, // No auth object
    };
    const mockData: Partial<Ad> = { title: 'Another Ad' };
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {}); // Spy on console.warn

    const args: HookArgs = {
      // @ts-ignore
      req: mockReq,
      operation: 'create',
      data: mockData,
      originalDoc: undefined,
      collection: {} as any,
    };

    const result = await populateAuthorClerkId(args);

    expect(result.authorClerkId).toBeUndefined();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'populateAuthorClerkId hook: Attempted to create an ad without a Clerk user ID in req.auth. authorClerkId will not be set.'
    );
    consoleWarnSpy.mockRestore(); // Restore console.warn
  });

  it('should not set data.authorClerkId if req.auth.userId is null or empty string during "create"', async () => {
    const mockReqNull = { // @ts-ignore
      auth: { userId: null } };
    const mockReqEmpty = { // @ts-ignore
      auth: { userId: '' } };
    const mockData: Partial<Ad> = { title: 'Ad with null/empty user' };
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const argsNull: HookArgs = { // @ts-ignore
      req: mockReqNull, operation: 'create', data: { ...mockData }, originalDoc: undefined, collection: {} as any };
    const resultNull = await populateAuthorClerkId(argsNull);
    expect(resultNull.authorClerkId).toBeUndefined();
    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleWarnSpy.mockClear(); // Clear spy for next call

    const argsEmpty: HookArgs = { // @ts-ignore
      req: mockReqEmpty, operation: 'create', data: { ...mockData }, originalDoc: undefined, collection: {} as any };
    const resultEmpty = await populateAuthorClerkId(argsEmpty);
    expect(resultEmpty.authorClerkId).toBeUndefined();
    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should return the data object even if no modifications are made', async () => {
    const mockData: Partial<Ad> = { title: 'Unchanged Ad' };
    const args: HookArgs = {
      // @ts-ignore
      req: { auth: { userId: 'user123' } },
      operation: 'update', // Not 'create'
      data: mockData,
      originalDoc: { title: 'Unchanged Ad' } as Ad,
      collection: {} as any,
    };
    const result = await populateAuthorClerkId(args);
    expect(result).toBe(mockData); // Expect the same object reference
    expect(result.authorClerkId).toBeUndefined(); // Not set on update by this hook
  });
});
